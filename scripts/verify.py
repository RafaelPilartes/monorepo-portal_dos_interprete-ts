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
    """Source files under apps/ and packages/ (legacy/ is out of scope, AD-008)."""
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


# JSX text runs: tag-to-tag, tag-to-expression and expression-to-tag.
JSX_TEXT = re.compile(r"(?<=>)[^<>{}]*(?=[<{])|(?<=})[^<>{}]*(?=<)")


def strip_jsx_text(code: str) -> str:
    """Blank out text between JSX tags and expressions (user-facing Portuguese, D-84)."""
    return JSX_TEXT.sub(lambda m: blank(m.group(0)), code)


def line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


# --- check: no-direct-data-access (since C) ---------------------------------

DATA_ACCESS = re.compile(
    r"\bsupabase\s*\.\s*(from|rpc|storage|channel|auth)\b"
    r"|(?:(?<![\w.$])|\b(?:window|globalThis|self)\s*\.\s*)fetch\s*\("
)
IMPORT_SPEC = re.compile(r"""(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"])([^'"]+)\1""")


def check_no_direct_data_access(ctx: Context) -> list[Violation]:
    """Only packages/data/src/dao/ talks to Supabase or calls fetch (architecture.md §2, rule 4)."""
    violations = []
    for path in code_files(ctx.root):
        rel = relative(ctx.root, path)
        if rel.startswith(DAO_DIR):
            continue
        code, with_strings = mask_source(path.read_text())
        for match in DATA_ACCESS.finditer(code):
            violations.append(Violation(rel, line_of(code, match.start()), f"data access outside {DAO_DIR}"))
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
    for manifest in sorted([*ctx.root.glob("apps/*/package.json"), *ctx.root.glob("packages/*/package.json")]):
        version = json.loads(manifest.read_text()).get("version")
        if version != expected:
            violations.append(
                Violation(relative(ctx.root, manifest), 1, f"version {version!r} differs from root {expected!r}")
            )
    return violations


CHECKS: dict[str, Callable[[Context], list[Violation]]] = {
    "no-direct-data-access": check_no_direct_data_access,
    "no-cross-app-import": check_no_cross_app_import,
    "no-versioned-env": check_no_versioned_env,
    "english-identifiers": check_english_identifiers,
    "single-version": check_single_version,
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
