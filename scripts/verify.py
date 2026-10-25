#!/usr/bin/env python3
"""Structural checks of the monorepo (docs/plan/specs/foundation.md, "Verificações estruturais").

Every check prints file:line for each violation and the script exits 1 if any check fails.

    python3 scripts/verify.py              run every check against the repository
    python3 scripts/verify.py --self-test  prove every check catches the deliberate violations in
                                           scripts/fixtures/<check>/ and stays quiet on
                                           scripts/fixtures/<check>-clean/
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

REPO_ROOT = Path(__file__).resolve().parent.parent
FIXTURES = REPO_ROOT / "scripts" / "fixtures"

CODE_SUFFIXES = {".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"}
SKIP_DIRS = {"node_modules", "dist", "coverage", ".turbo"}
APP_NAMES = ("site-web", "requester-web", "interpreter-web", "admin-web", "api")
SCOPE_NAME = "@portal-dos-interpretes"
DAO_DIR = "packages/data/src/dao/"


@dataclass(frozen=True)
class Violation:
    path: str
    line: int
    message: str

    def __str__(self) -> str:
        return f"{self.path}:{self.line}: {self.message}"


@dataclass(frozen=True)
class Context:
    """What a check looks at: a repository root and the files git tracks there."""

    root: Path
    tracked: tuple[str, ...]


def code_files(root: Path) -> list[Path]:
    """Source files under apps/ and packages/."""
    found: list[Path] = []
    for top in ("apps", "packages"):
        base = root / top
        if not base.is_dir():
            continue
        for path in base.rglob("*"):
            if path.suffix not in CODE_SUFFIXES or not path.is_file():
                continue
            if SKIP_DIRS.intersection(path.relative_to(root).parts):
                continue
            found.append(path)
    return sorted(found)


def relative(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


# --- lexer -------------------------------------------------------------------


def blank(text: str) -> str:
    return re.sub(r"[^\n]", " ", text)


def _regex_can_start(source: str, index: int) -> bool:
    """A "/" starts a regex literal when it follows an operator, a bracket or a keyword."""
    k = index - 1
    while k >= 0 and source[k] in " \t\r\n":
        k -= 1
    if k < 0:
        return True
    # "<" and ">" are left out: in JSX they precede closing tags ("</span>").
    if source[k] in "(,=:[!&|?{};+-*%~^":
        return True
    word = re.search(r"([A-Za-z_$][\w$]*)$", source[: k + 1])
    return bool(word and word.group(1) in {"return", "typeof", "case", "do", "else", "in", "of", "void", "yield", "await"})


def mask_source(source: str) -> tuple[str, str]:
    """Return (code, code_with_strings).

    code: comments and the contents of string/template literals blanked out.
    code_with_strings: only comments blanked out (to read import specifiers).
    Both keep every character position, so line numbers stay valid.
    """
    code: list[str] = []
    keep: list[str] = []
    i, n = 0, len(source)
    while i < n:
        two = source[i : i + 2]
        char = source[i]
        if two == "//":
            end = source.find("\n", i)
            end = n if end == -1 else end
            code.append(blank(source[i:end]))
            keep.append(blank(source[i:end]))
            i = end
        elif two == "/*":
            end = source.find("*/", i + 2)
            end = n if end == -1 else end + 2
            code.append(blank(source[i:end]))
            keep.append(blank(source[i:end]))
            i = end
        elif char == "/" and _regex_can_start(source, i):
            j = i + 1
            in_class = False
            while j < n and source[j] != "\n":
                if source[j] == "\\":
                    j += 2
                    continue
                if source[j] == "[":
                    in_class = True
                elif source[j] == "]":
                    in_class = False
                elif source[j] == "/" and not in_class:
                    break
                j += 1
            end = min(j + 1, n)
            literal = source[i:end]
            code.append("/" + blank(literal[1:-1]) + (literal[-1] if len(literal) > 1 else ""))
            keep.append(literal)
            i = end
        elif char in "'\"`":
            j = i + 1
            while j < n and source[j] != char:
                if source[j] == "\\":
                    j += 1
                elif char != "`" and source[j] == "\n":
                    break
                j += 1
            end = min(j + 1, n)
            literal = source[i:end]
            code.append(char + blank(literal[1:-1]) + (literal[-1] if len(literal) > 1 else ""))
            keep.append(literal)
            i = end
        else:
            code.append(char)
            keep.append(char)
            i += 1
    return "".join(code), "".join(keep)


# JSX text runs: tag-to-tag, tag-to-expression, expression-to-tag, and expression-to-expression
# when the run cannot be code (no parentheses, '=', ';' or ':').
JSX_TEXT = re.compile(r"(?<=>)[^<>{}]*(?=[<{])|(?<=})[^<>{}]*(?=<)|(?<=})[^<>{}()=;:]*(?={)")


def strip_jsx_text(code: str) -> str:
    """Blank out text between JSX tags and expressions (user-facing Portuguese, D-84)."""
    return JSX_TEXT.sub(lambda m: blank(m.group(0)), code)


def line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


# --- check: no-direct-data-access (since C) ---------------------------------

SUPABASE_ACCESS = re.compile(r"\bsupabase\s*\.\s*(from|rpc|storage|channel|auth)\b")
FETCH_CALL = re.compile(r"(?:(?<![\w.$])|\b(?:window|globalThis|self)\s*\.\s*)fetch\s*\(")
# The API's one door to outside services (Storage, Auth, email); see docs/plan/step-plans/G.md.
API_INTEGRATIONS_DIR = "apps/api/src/integrations/"
# Local database tooling (bootstrap-admin.mjs talks to the local Auth); never shipped to an app.
DB_SCRIPTS_DIR = "packages/db/scripts/"
IMPORT_SPEC = re.compile(r"""(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"])([^'"]+)\1""")


def check_no_direct_data_access(ctx: Context) -> list[Violation]:
    """Only packages/data/src/dao/ talks to Supabase or calls fetch (architecture.md §2, rule 4);
    the API may also call fetch in apps/api/src/integrations/ (its door to Storage and Auth)."""
    violations = []
    for path in code_files(ctx.root):
        rel = relative(ctx.root, path)
        if rel.startswith(DAO_DIR):
            continue
        code, with_strings = mask_source(path.read_text())
        for match in SUPABASE_ACCESS.finditer(code):
            violations.append(Violation(rel, line_of(code, match.start()), f"data access outside {DAO_DIR}"))
        if not rel.startswith((API_INTEGRATIONS_DIR, DB_SCRIPTS_DIR)):
            for match in FETCH_CALL.finditer(code):
                violations.append(Violation(rel, line_of(code, match.start()), f"fetch outside {DAO_DIR} and {API_INTEGRATIONS_DIR}"))
        for match in IMPORT_SPEC.finditer(with_strings):
            if match.group(2).startswith("@supabase/"):
                line = line_of(with_strings, match.start())
                violations.append(Violation(rel, line, f"imports {match.group(2)} outside {DAO_DIR}"))
    return violations


# --- check: no-cross-app-import (since C) -----------------------------------


def check_no_cross_app_import(ctx: Context) -> list[Violation]:
    """No app imports another app; shared code goes to packages/ (architecture.md §2, rule 1)."""
    violations = []
    for path in code_files(ctx.root):
        rel = relative(ctx.root, path)
        parts = rel.split("/")
        if parts[0] != "apps":
            continue
        own_app = parts[1]
        _, with_strings = mask_source(path.read_text())
        for match in IMPORT_SPEC.finditer(with_strings):
            spec = match.group(2)
            target = None
            for app in APP_NAMES:
                if spec == f"{SCOPE_NAME}/{app}" or spec.startswith(f"{SCOPE_NAME}/{app}/"):
                    target = app
            if spec.startswith("."):
                resolved = (path.parent / spec).resolve()
                try:
                    resolved_parts = resolved.relative_to(ctx.root.resolve()).parts
                except ValueError:
                    resolved_parts = ()
                if len(resolved_parts) > 1 and resolved_parts[0] == "apps":
                    target = resolved_parts[1]
            if target and target != own_app:
                line = line_of(with_strings, match.start())
                violations.append(Violation(rel, line, f"app '{own_app}' imports app '{target}'"))
    return violations


# --- check: no-versioned-env (since C) --------------------------------------

ENV_FILE = re.compile(r"(^|/)\.env(\.[^/]+)?$")


def check_no_versioned_env(ctx: Context) -> list[Violation]:
    """No .env or .env.* file (except .env.example) is tracked (claude-code-rules.md §1.2)."""
    return [
        Violation(name, 1, "environment file is versioned")
        for name in ctx.tracked
        if ENV_FILE.search(name) and not name.endswith(".env.example")
    ]


# --- check: english-identifiers (since C) -----------------------------------

# Portuguese words that are not also English words (D-84). Accents stripped.
PORTUGUESE_WORDS = {
    "pedido", "pedidos", "solicitante", "solicitantes", "interprete", "interpretes", "utilizador",
    "utilizadores", "pagamento", "pagamentos", "avaliacao", "avaliacoes", "verificacao", "servico",
    "servicos", "preco", "precos", "equipa", "empresa", "morada", "telefone", "nome", "valor",
    "estado", "mensagem", "mensagens", "conversa", "documento", "documentos", "comprovativo",
    "reembolso", "repasse", "configuracao", "definicoes", "perfil", "utilizar", "guardar", "apagar",
    "criar", "editar", "lista", "listar", "pesquisa", "pesquisar", "cancelar", "aceitar", "recusar",
    "concluir", "enviar", "contacto", "contactos", "formacao", "disponibilidade", "agendamento",
}
IDENTIFIER = re.compile(r"[^\W\d][\w$]*")


def ascii_fold(word: str) -> str:
    return unicodedata.normalize("NFKD", word).encode("ascii", "ignore").decode()


def split_identifier(name: str) -> list[str]:
    spaced = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", name.replace("_", " ").replace("$", " "))
    return [ascii_fold(word).lower() for word in spaced.split() if word]


def check_english_identifiers(ctx: Context) -> list[Violation]:
    """Every identifier in code is English (D-84); strings, comments and JSX text are skipped."""
    violations = []
    for path in code_files(ctx.root):
        rel = relative(ctx.root, path)
        code, _ = mask_source(path.read_text())
        if path.suffix in {".tsx", ".jsx"}:
            code = strip_jsx_text(code)
        seen: set[tuple[int, str]] = set()
        for match in IDENTIFIER.finditer(code):
            name = match.group(0)
            words = [w for w in split_identifier(name) if w in PORTUGUESE_WORDS]
            line = line_of(code, match.start())
            if words and (line, name) not in seen:
                seen.add((line, name))
                violations.append(Violation(rel, line, f"identifier '{name}' uses Portuguese word(s) {words}"))
    return violations


# --- check: single-version (since C) ----------------------------------------


def check_single_version(ctx: Context) -> list[Violation]:
    """Root, apps and packages share one version (architecture.md §9)."""
    root_file = ctx.root / "package.json"
    if not root_file.is_file():
        return [Violation("package.json", 1, "missing root package.json")]
    expected = json.loads(root_file.read_text()).get("version")
    violations = []
    for manifest in sorted([*ctx.root.glob("apps/*/package.json"), *ctx.root.glob("packages/*/package.json"), *ctx.root.glob("tests/*/package.json")]):
        version = json.loads(manifest.read_text()).get("version")
        if version != expected:
            violations.append(
                Violation(relative(ctx.root, manifest), 1, f"version {version!r} differs from root {expected!r}")
            )
    return violations


# --- check: package-dependencies (since D1) ----------------------------------

# architecture.md §2 "Regra de dependências"; config (tooling) is allowed everywhere.
# site-web -> features is AD-010 (public directory components).
ALLOWED_DEPENDENCIES: dict[str, set[str]] = {
    "site-web": {"ui", "i18n", "core", "db-types", "data", "auth", "features"},
    "requester-web": {"ui", "i18n", "core", "db-types", "data", "auth", "features"},
    "interpreter-web": {"ui", "i18n", "core", "db-types", "data", "auth", "features"},
    "admin-web": {"ui", "i18n", "core", "db-types", "data", "auth", "features"},
    "api": {"core", "i18n", "db-types"},
    "features": {"ui", "data", "i18n", "core"},
    "data": {"db-types", "core"},
    # auth -> data: the session comes through the data layer's SessionDAO; auth -> core: error messages (AD-019).
    "auth": {"ui", "i18n", "db-types", "data", "core"},
    "core": set(),
    # ui -> i18n: MoneyAmount and StatusBadge reuse formatAoa and COMMON_TEXTS (AD-018).
    "ui": {"i18n"},
    "i18n": set(),
    "db": set(),
    "db-types": set(),
    "config": set(),
    "e2e": set(),
}


def check_package_dependencies(ctx: Context) -> list[Violation]:
    """Workspace packages depend only on what architecture.md §2 allows."""
    violations = []
    manifests = [*ctx.root.glob("apps/*/package.json"), *ctx.root.glob("packages/*/package.json"), *ctx.root.glob("tests/*/package.json")]
    for manifest in sorted(manifests):
        data = json.loads(manifest.read_text())
        name = str(data.get("name", "")).removeprefix(f"{SCOPE_NAME}/")
        allowed = ALLOWED_DEPENDENCIES.get(name)
        rel = relative(ctx.root, manifest)
        if allowed is None:
            violations.append(Violation(rel, 1, f"package '{name}' has no entry in the dependency rule"))
            continue
        declared = {**data.get("dependencies", {}), **data.get("devDependencies", {}), **data.get("peerDependencies", {})}
        for dependency in sorted(declared):
            if not dependency.startswith(f"{SCOPE_NAME}/"):
                continue
            target = dependency.removeprefix(f"{SCOPE_NAME}/")
            if target != "config" and target not in allowed:
                line = next((i for i, l in enumerate(manifest.read_text().splitlines(), 1) if f'"{dependency}"' in l), 1)
                violations.append(Violation(rel, line, f"'{name}' may not depend on '{target}' (architecture.md §2)"))
    return violations


# --- check: error-catalog (since E) ------------------------------------------


def check_error_catalog(ctx: Context) -> list[Violation]:
    """packages/core's error catalog is generated from docs/plan/api.md §2 (one source)."""
    sys.path.insert(0, str(REPO_ROOT / "scripts"))
    import error_catalog  # noqa: E402  (sibling script)

    doc = ctx.root / "docs" / "plan" / "api.md"
    target = ctx.root / "packages" / "core" / "src" / "errors" / "catalog.ts"
    if not doc.is_file():
        return [Violation("docs/plan/api.md", 1, "missing: the error catalog has no source")]
    text = doc.read_text(encoding="utf-8")
    section = text[text.find("## 2. Erros"): text.find("## 3. Sistema")]
    code_rows = [i for i, line in enumerate(section.splitlines(), 1) if line.startswith("| `")]
    parsed = error_catalog.parse(text)
    if len(parsed) != len(code_rows):
        return [Violation("docs/plan/api.md", 1, f"{len(code_rows) - len(parsed)} error row(s) in §2 do not parse (code must be UPPER_SNAKE)")]
    expected = error_catalog.render(parsed)
    current = target.read_text(encoding="utf-8") if target.is_file() else ""
    if current == expected:
        return []
    return [Violation(relative(ctx.root, target) if target.is_file() else "packages/core/src/errors/catalog.ts", 1,
                      "differs from docs/plan/api.md §2; run python3 scripts/error_catalog.py --write")]


# --- check: no-duplicated-component (since E) --------------------------------

SHARED_COMPONENT_DIRS = ("packages/ui/src/components", "packages/features/src/components", "packages/features/src/pages")


def _component_key(path: Path) -> str:
    """'FiltersBar.tsx', 'filters-bar.tsx' and 'filters_bar.tsx' are the same component name."""
    return re.sub(r"[^a-z0-9]", "", path.stem.lower())


def _content_key(path: Path) -> str:
    """The code without imports (single- or multi-line), export style or whitespace."""
    _, with_strings = mask_source(path.read_text())
    body = re.sub(r"^\s*import\b[\s\S]*?from\s*['\"][^'\"]+['\"];?|^\s*import\s*['\"][^'\"]+['\"];?", "", with_strings, flags=re.M)
    body = re.sub(r"\bexport\s+default\s+", "export ", body)
    return re.sub(r"\s+", "", body)


def check_no_duplicated_component(ctx: Context) -> list[Violation]:
    """No app keeps a copy of a component that lives in a package (foundation.md §E)."""
    shared_names: dict[str, str] = {}
    shared_bodies: dict[str, str] = {}
    for directory in SHARED_COMPONENT_DIRS:
        base = ctx.root / directory
        if not base.is_dir():
            continue
        for path in base.rglob("*.tsx"):
            if path.name.endswith(".test.tsx"):
                continue
            shared_names[_component_key(path)] = relative(ctx.root, path)
            shared_bodies[_content_key(path)] = relative(ctx.root, path)
    violations = []
    for path in sorted(ctx.root.glob("apps/*/src/**/*.tsx")):
        if path.name.endswith(".test.tsx") or SKIP_DIRS.intersection(path.relative_to(ctx.root).parts):
            continue
        rel = relative(ctx.root, path)
        if "/components/" in rel and _component_key(path) in shared_names:
            violations.append(Violation(rel, 1, f"same component name as {shared_names[_component_key(path)]}"))
        elif _content_key(path) in shared_bodies:
            violations.append(Violation(rel, 1, f"same code as {shared_bodies[_content_key(path)]}"))
    return violations


# --- database checks (since F) ----------------------------------------------------------------

DB_DIR = "packages/db"


def sql_files(root: Path, subdir: str = "") -> list[Path]:
    """SQL files under packages/db (or one of its phase directories), in name order."""
    base = root / DB_DIR / subdir
    if not base.is_dir():
        return []
    return sorted(p for p in base.rglob("*.sql") if not SKIP_DIRS.intersection(p.relative_to(root).parts))


def mask_sql(text: str) -> str:
    """Blank out comments and single-quoted strings, keeping offsets (dollar-quoted bodies stay: they are code)."""
    out = list(text)
    i, n = 0, len(text)
    while i < n:
        if text.startswith("--", i):
            j = text.find("\n", i)
            j = n if j == -1 else j
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            j = n if j == -1 else j + 2
        elif text[i] == "'":
            j = i + 1
            while j < n:
                if text.startswith("''", j):
                    j += 2
                    continue
                if text[j] == "'":
                    j += 1
                    break
                j += 1
        else:
            i += 1
            continue
        for k in range(i, j):
            if out[k] != "\n":
                out[k] = " "
        i = j
    return "".join(out)


def strip_sql_comments(text: str) -> str:
    """Blank out comments only (string literals stay), keeping line numbers."""
    without_blocks = re.sub(r"/\*[\s\S]*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group()), text)
    return re.sub(r"--[^\n]*", "", without_blocks)


def check_migration_transaction(ctx: Context) -> list[Violation]:
    """Every migration opens with BEGIN; and closes with COMMIT; (architecture.md §5)."""
    violations = []
    for path in sql_files(ctx.root, "migrations"):
        lines = strip_sql_comments(path.read_text(encoding="utf-8")).splitlines()
        statements = [(i, line.strip()) for i, line in enumerate(lines, 1) if line.strip()]
        rel = relative(ctx.root, path)
        if not statements or statements[0][1] != "BEGIN;":
            violations.append(Violation(rel, statements[0][0] if statements else 1, "a migration must open with BEGIN;"))
        if not statements or statements[-1][1] != "COMMIT;":
            violations.append(Violation(rel, statements[-1][0] if statements else 1, "a migration must close with COMMIT;"))
    return violations


CREATE_TABLE = re.compile(r"\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.\"]+)", re.I)
ENABLE_RLS = re.compile(r"\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?([\w.\"]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY", re.I)
DISABLE_RLS = re.compile(r"\b(DISABLE\s+ROW\s+LEVEL\s+SECURITY|NO\s+FORCE\s+ROW\s+LEVEL\s+SECURITY)\b", re.I)


def check_table_rls(ctx: Context) -> list[Violation]:
    """Every table is created schema-qualified, has ENABLE ROW LEVEL SECURITY, and RLS is never turned off (data-model.md §0)."""
    files = [(path, mask_sql(path.read_text(encoding="utf-8"))) for path in sql_files(ctx.root)]
    enabled = {m.group(1).lower() for _, text in files for m in ENABLE_RLS.finditer(text)}
    violations = []
    for path, text in files:
        for match in CREATE_TABLE.finditer(text):
            name = match.group(1).lower()
            if "." not in name:
                violations.append(Violation(relative(ctx.root, path), line_of(text, match.start()), f"table {name} must be schema-qualified"))
            elif name not in enabled:
                violations.append(Violation(relative(ctx.root, path), line_of(text, match.start()), f"{name} has no ENABLE ROW LEVEL SECURITY"))
        for match in DISABLE_RLS.finditer(text):
            violations.append(Violation(relative(ctx.root, path), line_of(text, match.start()), "row level security is never turned off"))
    return violations


CREATE_FUNCTION = re.compile(r"\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([\w.\"]+)", re.I)
DOLLAR_TAG = re.compile(r"\$(\w*)\$")


def sql_functions(text: str) -> list[tuple[str, int, str, int, int]]:
    """(name, offset, options, body_start, body_end) of each CREATE FUNCTION; options exclude the body.

    The body is the dollar-quoted or single-quoted string after AS, looked for only up to the next
    CREATE, so one function never borrows the body of the next.
    """
    found = []
    starts = [m for m in CREATE_FUNCTION.finditer(text)]
    for index, match in enumerate(starts):
        limit = starts[index + 1].start() if index + 1 < len(starts) else len(text)
        as_body = re.compile(r"\bAS\s+(\$\w*\$|')", re.I).search(text, match.end(), limit)
        if not as_body:
            continue
        opener = as_body.group(1)
        body_start = as_body.end()
        if opener == "'":
            body_end = body_start
            while body_end < len(text):
                if text.startswith("''", body_end):
                    body_end += 2
                    continue
                if text[body_end] == "'":
                    break
                body_end += 1
            after = body_end + 1
        else:
            body_end = text.find(opener, body_start)
            if body_end == -1:
                continue
            after = body_end + len(opener)
        end = text.find(";", after)
        end = len(text) if end == -1 else end
        options = text[match.start():as_body.start()] + " " + text[after:end]
        found.append((match.group(1).lower(), match.start(), options, body_start, body_end))
    return found


def check_definer_search_path(ctx: Context) -> list[Violation]:
    """Every SECURITY DEFINER function pins SET search_path = '' (architecture.md §5)."""
    violations = []
    for path in sql_files(ctx.root):
        text = strip_sql_comments(path.read_text(encoding="utf-8"))
        for name, offset, options, _, _ in sql_functions(text):
            definer = re.search(r"\bSECURITY\s+DEFINER\b", options, re.I)
            if definer and not re.search(r"\bSET\s+search_path\s*(=|TO)\s*''", options, re.I):
                violations.append(Violation(relative(ctx.root, path), line_of(text, offset), f"{name} is SECURITY DEFINER without SET search_path = ''"))
    return violations


def split_top_level(body: str) -> list[tuple[int, str]]:
    """Split a CREATE TABLE body on top-level commas: (offset, element)."""
    parts, depth, start = [], 0, 0
    for i, ch in enumerate(body):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == "," and depth == 0:
            parts.append((start, body[start:i]))
            start = i + 1
    parts.append((start, body[start:]))
    return parts


def column_names(listing: str) -> list[str]:
    return [item.strip().split()[0].strip('"').lower() for item in listing.split(",") if item.strip()]


INDEX_ON = re.compile(r"\bCREATE\s+(?:UNIQUE\s+)?INDEX\b[^;]*?\bON\s+(?:ONLY\s+)?([\w.\"]+)\s*(?:USING\s+\w+\s*)?\(([^;]*?)\)\s*(?:INCLUDE|WHERE|WITH|TABLESPACE|;)", re.I)
ALTER_FK = re.compile(r"\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?([\w.\"]+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]*)\)", re.I)


def check_fk_index(ctx: Context) -> list[Violation]:
    """Every foreign key has an index whose leading columns are the key's columns (data-model.md §0)."""
    files = [(path, mask_sql(path.read_text(encoding="utf-8"))) for path in sql_files(ctx.root)]
    indexed: dict[str, list[list[str]]] = {}
    for _, text in files:
        for match in INDEX_ON.finditer(text):
            indexed.setdefault(match.group(1).lower(), []).append(column_names(match.group(2)))
    keys: list[tuple[Path, int, str, list[str]]] = []
    for path, text in files:
        for match in CREATE_TABLE.finditer(text):
            table = match.group(1).lower()
            open_at = text.find("(", match.end())
            depth, close_at = 0, open_at
            for close_at in range(open_at, len(text)):
                depth += {"(": 1, ")": -1}.get(text[close_at], 0)
                if depth == 0:
                    break
            for offset, element in split_top_level(text[open_at + 1:close_at]):
                stripped = element.strip()
                head = stripped.split()[0].upper() if stripped else ""
                position = open_at + 1 + offset + (len(element) - len(element.lstrip()))
                inner = re.search(r"\(([^)]*)\)", stripped)
                if head in {"PRIMARY", "UNIQUE"} and inner:
                    indexed.setdefault(table, []).append(column_names(inner.group(1)))
                elif re.match(r"(CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY", stripped, re.I) and inner:
                    keys.append((path, line_of(text, position), table, column_names(inner.group(1))))
                elif re.search(r"\bREFERENCES\b", stripped, re.I) and head not in {"CONSTRAINT", "CHECK"}:
                    column = stripped.split()[0].strip('"').lower()
                    if re.search(r"\b(PRIMARY\s+KEY|UNIQUE)\b", stripped, re.I):
                        indexed.setdefault(table, []).append([column])
                    keys.append((path, line_of(text, position), table, [column]))
        for match in ALTER_FK.finditer(text):
            keys.append((path, line_of(text, match.start()), match.group(1).lower(), column_names(match.group(2))))
    violations = []
    for path, line, table, columns in keys:
        if not any(index[:len(columns)] == columns for index in indexed.get(table, [])):
            violations.append(Violation(relative(ctx.root, path), line, f"foreign key {table} ({', '.join(columns)}) has no index starting with its columns"))
    return violations


SQL_DOMAIN = re.compile(r"\bCREATE\s+DOMAIN\s+util\.(\w+)\s+AS\s+[\w.]+\s+CHECK\s*\(\s*VALUE\s+~\s+'((?:[^']|'')*)'\s*\)", re.I)
CORE_PATTERN = re.compile(r"^export\s+const\s+(\w+)_PATTERN\s*=\s*/(.+)/\s*$", re.M)
SHARED_PATTERNS = {"phone_e164": "PHONE_E164", "nif": "NIF", "iban_ao": "IBAN_AO", "email": "EMAIL"}


def check_domain_patterns(ctx: Context) -> list[Violation]:
    """util.phone_e164, util.nif, util.iban_ao and util.email use the same expressions as packages/core (R-CFG-05)."""
    core_path = ctx.root / "packages" / "core" / "src" / "patterns.ts"
    core_text = core_path.read_text(encoding="utf-8") if core_path.is_file() else ""
    core = {m.group(1): m.group(2) for m in CORE_PATTERN.finditer(core_text)}
    domains: dict[str, tuple[str, str, int]] = {}
    for path in sql_files(ctx.root, "migrations"):
        text = strip_sql_comments(path.read_text(encoding="utf-8"))
        for m in SQL_DOMAIN.finditer(text):
            domains[m.group(1).lower()] = (m.group(2).replace("''", "'"), relative(ctx.root, path), line_of(text, m.start()))
    violations = []
    for domain, constant in SHARED_PATTERNS.items():
        if domain not in domains:
            violations.append(Violation(f"{DB_DIR}/migrations", 1, f"util.{domain} is not created with CHECK (VALUE ~ '...') in any migration"))
        elif constant not in core:
            violations.append(Violation("packages/core/src/patterns.ts", 1, f"{constant}_PATTERN is missing"))
        elif core[constant] != domains[domain][0]:
            expression, rel, line = domains[domain]
            violations.append(Violation(rel, line, f"util.{domain} '{expression}' differs from {constant}_PATTERN /{core[constant]}/"))
    return violations


def check_notify_kinds(ctx: Context) -> list[Violation]:
    """notify.kinds is seeded from the catalog in docs/plan/specs/notifications.md (R-NOT-01)."""
    sys.path.insert(0, str(REPO_ROOT / "scripts"))
    import notify_kinds  # noqa: E402  (sibling script)

    if not (ctx.root / notify_kinds.SPEC).is_file():
        return [Violation(str(notify_kinds.SPEC), 1, "missing: the notification catalog has no source")]
    try:
        expected = notify_kinds.expected(ctx.root)
    except ValueError as error:
        return [Violation(str(notify_kinds.SPEC), 1, str(error))]
    target = ctx.root / notify_kinds.TARGET
    if target.is_file() and target.read_text(encoding="utf-8") == expected:
        return []
    return [Violation(str(notify_kinds.TARGET), 1, "differs from the catalog; run python3 scripts/notify_kinds.py --write")]


# data-model.md §12 names booking, billing, verification and community; identity and support also
# run time-based tasks (expire_org_invites, autoclose_resolved), so they follow the same rule.
RULE_SCHEMAS = ("booking.", "billing.", "verification.", "community.", "identity.", "support.")
CLOCK_CALL = re.compile(
    r"([\w.]*?)\bnow\s*\("
    r"|\b(current_timestamp|current_date|current_time|localtimestamp|localtime)\b"
    r"|\b(transaction_timestamp|statement_timestamp|clock_timestamp|timeofday)\s*\(",
    re.I,
)
CLOCK_LITERAL = re.compile(r"'(now|today|tomorrow|yesterday)'", re.I)


def check_rule_clock(ctx: Context) -> list[Violation]:
    """Rule functions read the time from util.now(), never from the server clock (data-model.md §12)."""
    violations = []
    for path in sql_files(ctx.root):
        text = strip_sql_comments(path.read_text(encoding="utf-8"))
        for name, _, _, body_start, body_end in sql_functions(text):
            if not name.startswith(RULE_SCHEMAS):
                continue
            body = text[body_start:body_end]
            if text[body_start - 1] == "'":
                body = body.replace("''", "'")  # a single-quoted body: its code, unescaped
            first_line = line_of(text, body_start)
            masked = mask_sql(body)  # calls inside the body's own strings are text, not clock reads
            hits = [m for m in CLOCK_CALL.finditer(masked) if not (m.group(1) or "").lower() == "util."]
            hits += list(CLOCK_LITERAL.finditer(body))
            for m in hits:
                line = first_line + body.count("\n", 0, m.start())
                violations.append(Violation(relative(ctx.root, path), line, f"{name} reads the server clock ({m.group(0).strip()}); use util.now()"))
    return violations


SCHEMA_LIST_SOURCES = {
    "packages/db/functions/10-util.sql": re.compile(r"project_schemas\(\)[\s\S]*?ARRAY\[([^\]]*)\]"),
    "packages/db/scripts/lib.sh": re.compile(r'^OWN_SCHEMAS="([^"]*)"', re.M),
}


def _names(listing: str) -> set[str]:
    return {name for name in re.split(r"[\s,'\"]+", listing) if name}


def check_schema_lists(ctx: Context) -> list[Violation]:
    """The project's schemas are written the same everywhere: migrations, util.project_schemas(),
    lib.sh, and the exposed lists of lib.sh and supabase/config.toml (architecture.md §5)."""
    created: set[str] = set()
    for path in sql_files(ctx.root, "migrations"):
        created |= {m.group(1).lower() for m in re.finditer(r"\bCREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)", strip_sql_comments(path.read_text(encoding="utf-8")), re.I)}
    if not created:
        return []
    internal = {"util", "auth_helper"}
    violations = []
    for rel, pattern in SCHEMA_LIST_SOURCES.items():
        path = ctx.root / rel
        match = pattern.search(path.read_text(encoding="utf-8")) if path.is_file() else None
        if not match:
            violations.append(Violation(rel, 1, "the list of project schemas is missing"))
        elif _names(match.group(1)) != created:
            violations.append(Violation(rel, line_of(path.read_text(encoding="utf-8"), match.start()), f"schemas differ from the migrations: {sorted(_names(match.group(1)) ^ created)}"))
    exposed_sources = {
        "packages/db/scripts/lib.sh": re.compile(r'^EXPOSED_SCHEMAS="([^"]*)"', re.M),
        "supabase/config.toml": re.compile(r"^schemas = \[([^\]]*)\]", re.M),
    }
    for rel, pattern in exposed_sources.items():
        path = ctx.root / rel
        match = pattern.search(path.read_text(encoding="utf-8")) if path.is_file() else None
        exposed = _names(match.group(1)) - {"graphql_public"} if match else set()
        if not match:
            violations.append(Violation(rel, 1, "the list of exposed schemas is missing"))
        elif exposed != created - internal:
            violations.append(Violation(rel, line_of(path.read_text(encoding="utf-8"), match.start()), f"exposed schemas differ from the migrations minus util and auth_helper: {sorted(exposed ^ (created - internal))}"))
    return violations



# --- check: bucket-limits (since G) -------------------------------------------------------------

FILE_RULES_PATH = "apps/api/src/lib/files.ts"
BUCKET_SECTION = re.compile(r"^\[storage\.buckets\.([\w-]+)\]\s*$((?:\n(?!\[).*)*)", re.M)
RULE_LINE = re.compile(r"^\s*(\w+):\s*\{\s*bucket:\s*'([\w-]+)',\s*types:\s*(\w+),\s*maxBytes:\s*(\d+)\s*\*\s*MB\s*\}", re.M)
TYPE_LIST = re.compile(r"^const\s+(\w+)\s*=\s*\[([^\]]*)\]", re.M)


def check_bucket_limits(ctx: Context) -> list[Violation]:
    """The API's file rules (type and size per purpose) equal the bucket limits in supabase/config.toml."""
    rules_path, config_path = ctx.root / FILE_RULES_PATH, ctx.root / "supabase" / "config.toml"
    if not rules_path.is_file():
        return []
    rules = rules_path.read_text(encoding="utf-8")
    config = config_path.read_text(encoding="utf-8") if config_path.is_file() else ""
    buckets = {}
    for m in BUCKET_SECTION.finditer(config):
        size = re.search(r'^file_size_limit\s*=\s*"(\d+)MiB"', m.group(2), re.M)
        types = re.search(r"^allowed_mime_types\s*=\s*\[([^\]]*)\]", m.group(2), re.M)
        buckets[m.group(1)] = (int(size.group(1)) if size else None, set(re.findall(r'"([^"]+)"', types.group(1))) if types else set())
    lists = {m.group(1): set(re.findall(r"'([^']+)'", m.group(2))) for m in TYPE_LIST.finditer(rules)}
    violations = []
    purposes_match = re.search(r"FILE_PURPOSES\s*=\s*\[([^\]]*)\]", rules)
    purposes = re.findall(r"'([^']+)'", purposes_match.group(1)) if purposes_match else []
    read = {m.group(1) for m in RULE_LINE.finditer(rules)}
    if not purposes:
        violations.append(Violation(FILE_RULES_PATH, 1, "FILE_PURPOSES is missing"))
    for purpose in purposes:
        if purpose not in read:
            violations.append(Violation(FILE_RULES_PATH, 1, f"{purpose}: its rule is not written as `{purpose}: {{ bucket: '...', types: LIST, maxBytes: N * MB }}` on one line, so it cannot be checked"))
    for m in RULE_LINE.finditer(rules):
        purpose, bucket, list_name, megabytes = m.group(1), m.group(2), m.group(3), int(m.group(4))
        line = line_of(rules, m.start())
        if bucket not in buckets:
            violations.append(Violation(FILE_RULES_PATH, line, f"{purpose}: bucket {bucket} is not in supabase/config.toml"))
            continue
        size, types = buckets[bucket]
        if size != megabytes:
            violations.append(Violation(FILE_RULES_PATH, line, f"{purpose}: {megabytes} MB here, {size} MiB for bucket {bucket} in supabase/config.toml"))
        if lists.get(list_name) != types:
            violations.append(Violation(FILE_RULES_PATH, line, f"{purpose}: types {sorted(lists.get(list_name, set()))} here, {sorted(types)} for bucket {bucket}"))
    return violations


# --- check: api-error-shape (since G) -------------------------------------------------------------

API_ERROR_OWNERS = {"apps/api/src/lib/sendApiError.ts", "apps/api/src/lib/dbErrors.ts"}
# An object key named field or message in any form (plain, quoted, computed, shorthand), not a
# parameter or property type annotation; and any reply that sends an `error` object by hand.
ERROR_KEYS = re.compile(
    r"[{,]\s*\[?\s*(['\"`]?)(field|message)\1\s*\]?\s*(?=[:,}])"
    r"(?!\s*:\s*(?:string|number|boolean|unknown)\b(?!\s*\())"
)
HAND_SENT_ERROR = re.compile(r"\.send\(\s*\{\s*(['\"`]?)error\1\s*[:,}]")


def check_api_error_shape(ctx: Context) -> list[Violation]:
    """No API code writes an error's field or message by hand: they come from the catalog through
    lib/sendApiError.ts and lib/dbErrors.ts (foundation.md, verify.py table, since G)."""
    violations = []
    for path in code_files(ctx.root):
        rel = relative(ctx.root, path)
        if not rel.startswith("apps/api/src/") or rel in API_ERROR_OWNERS or ".test." in rel or "/testing/" in rel:
            continue
        _, with_strings = mask_source(path.read_text())
        for match in ERROR_KEYS.finditer(with_strings):
            violations.append(Violation(rel, line_of(with_strings, match.start(2)), f"error {match.group(2)} written outside lib/sendApiError.ts and lib/dbErrors.ts"))
        for match in HAND_SENT_ERROR.finditer(with_strings):
            violations.append(Violation(rel, line_of(with_strings, match.start()), "an error body sent by hand; use sendApiError or throw ApiError"))
    return violations


# --- check: no-function-star (since H1) ----------------------------------------------------------

# "(f(...)).*" runs f once per output column in Postgres: a write function would run several times
# (two publishes, duplicate inserts). Use "SELECT * FROM f(...)".
FUNCTION_STAR = re.compile(r"\(\s*[A-Za-z_][\w]*\.[A-Za-z_][\w]*\s*\([^()]*\)\s*\)\s*\.\s*\*")


def check_no_function_star(ctx: Context) -> list[Violation]:
    """No SQL in the API or the database package expands a function call with (f(...)).*."""
    violations = []
    paths = [p for p in code_files(ctx.root) if relative(ctx.root, p).startswith(("apps/api/", "packages/db/"))]
    paths += sql_files(ctx.root)
    for path in paths:
        text = path.read_text(encoding="utf-8")
        for match in FUNCTION_STAR.finditer(text):
            violations.append(Violation(relative(ctx.root, path), line_of(text, match.start()), "(f(...)).* runs f once per column; use SELECT * FROM f(...)"))
    return violations

CHECKS: dict[str, Callable[[Context], list[Violation]]] = {
    "no-direct-data-access": check_no_direct_data_access,
    "no-cross-app-import": check_no_cross_app_import,
    "no-versioned-env": check_no_versioned_env,
    "english-identifiers": check_english_identifiers,
    "single-version": check_single_version,
    "package-dependencies": check_package_dependencies,
    "error-catalog": check_error_catalog,
    "no-duplicated-component": check_no_duplicated_component,
    "migration-transaction": check_migration_transaction,
    "table-rls": check_table_rls,
    "definer-search-path": check_definer_search_path,
    "fk-index": check_fk_index,
    "domain-patterns": check_domain_patterns,
    "notify-kinds": check_notify_kinds,
    "rule-clock": check_rule_clock,
    "schema-lists": check_schema_lists,
    "bucket-limits": check_bucket_limits,
    "api-error-shape": check_api_error_shape,
    "no-function-star": check_no_function_star,
}


def repo_context() -> Context:
    result = subprocess.run(["git", "ls-files"], cwd=REPO_ROOT, capture_output=True, text=True, check=True)
    return Context(REPO_ROOT, tuple(result.stdout.splitlines()))


def fixture_context(directory: Path) -> Context:
    listing = directory / "tracked-files.txt"
    tracked = tuple(line.strip() for line in listing.read_text().splitlines() if line.strip()) if listing.is_file() else ()
    return Context(directory, tracked)


def run_checks(ctx: Context) -> int:
    failed = 0
    for name, check in CHECKS.items():
        violations = check(ctx)
        if violations:
            failed += 1
            print(f"FAIL {name} ({len(violations)})")
            for violation in violations:
                print(f"  {violation}")
        else:
            print(f"ok   {name}")
    print(f"\nverify.py: {len(CHECKS) - failed}/{len(CHECKS)} checks passed")
    return 1 if failed else 0


def self_test() -> int:
    """Each check catches every expected violation in its fixture and none in its clean twin.

    A fixture lists the violations it must produce in expected.txt, one "path:line" per line
    (MASTER-PLAN.md, gate 2).
    """
    failed = 0
    for name, check in CHECKS.items():
        bad, clean = FIXTURES / name, FIXTURES / f"{name}-clean"
        problems: list[str] = []
        if not bad.is_dir() or not clean.is_dir():
            problems.append("missing fixture or clean twin")
        else:
            found = {f"{v.path}:{v.line}" for v in check(fixture_context(bad))}
            expected = {line.strip() for line in (bad / "expected.txt").read_text().splitlines() if line.strip()}
            if missing := sorted(expected - found):
                problems.append(f"missed {missing}")
            if extra := sorted(found - expected):
                problems.append(f"unexpected {extra}")
            if false_positives := check(fixture_context(clean)):
                problems.append(f"false positives on clean twin: {[str(v) for v in false_positives]}")
        if problems:
            failed += 1
            print(f"FAIL {name}: {'; '.join(problems)}")
        else:
            print(f"ok   {name}: catches {len(expected)} violation(s), clean twin stays quiet")
    print(f"\nself-test: {len(CHECKS) - failed}/{len(CHECKS)} checks behave")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--self-test", action="store_true", help="prove each check against its fixtures")
    args = parser.parse_args()
    return self_test() if args.self_test else run_checks(repo_context())


if __name__ == "__main__":
    sys.exit(main())
