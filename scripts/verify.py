#!/usr/bin/env python3
"""Structural checks of the monorepo (docs/plan/specs/foundation.md, "Verificações estruturais").

Every check prints file:line for each violation and the script exits 1 if any check fails.

    python3 scripts/verify.py              run every check against the repository
    python3 scripts/verify.py --self-test  prove every check catches its deliberate
                                           violation in scripts/fixtures/<check>/
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

REPO_ROOT = Path(__file__).resolve().parent.parent
FIXTURES = REPO_ROOT / "scripts" / "fixtures"

CODE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
SKIP_DIRS = {"node_modules", "dist", "coverage", ".turbo", "fixtures"}
APP_NAMES = ("site-web", "requester-web", "interpreter-web", "admin-web", "api")
SCOPE_NAME = "@portal-dos-interpretes"


@dataclass(frozen=True)
class Violation:
    path: str
    line: int
    message: str

    def __str__(self) -> str:
        return f"{self.path}:{self.line}: {self.message}"


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


def tracked_files(root: Path) -> list[str]:
    """Files git tracks; a fixture root lists them in tracked-files.txt instead."""
    listing = root / "tracked-files.txt"
    if listing.is_file():
        return [line.strip() for line in listing.read_text().splitlines() if line.strip()]
    result = subprocess.run(["git", "ls-files"], cwd=root, capture_output=True, text=True, check=True)
    return result.stdout.splitlines()


def relative(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def strip_comments(source: str) -> str:
    """Blank out // and /* */ comments, keeping line numbers."""
    source = re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), source, flags=re.S)
    return re.sub(r"(^|[^:'\"`])//[^\n]*", r"\1", source)


# --- check: no-direct-data-access (since C) ---------------------------------

DATA_ACCESS = re.compile(r"\bsupabase\s*\.\s*(from|rpc|storage)\b|(?<![\w.])fetch\s*\(")
DAO_DIR = "packages/data/src/dao/"


def check_no_direct_data_access(root: Path) -> list[Violation]:
    """Only packages/data/src/dao/ talks to Supabase or calls fetch (architecture.md §2, rule 4)."""
    violations = []
    for path in code_files(root):
        rel = relative(root, path)
        if rel.startswith(DAO_DIR):
            continue
        for number, line in enumerate(strip_comments(path.read_text()).splitlines(), 1):
            if DATA_ACCESS.search(line):
                violations.append(Violation(rel, number, f"data access outside {DAO_DIR}"))
    return violations


# --- check: no-cross-app-import (since C) -----------------------------------

IMPORT_SPEC = re.compile(r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""")


def check_no_cross_app_import(root: Path) -> list[Violation]:
    """No app imports another app; shared code goes to packages/ (architecture.md §2, rule 1)."""
    violations = []
    for path in code_files(root):
        rel = relative(root, path)
        parts = rel.split("/")
        if parts[0] != "apps":
            continue
        own_app = parts[1]
        for number, line in enumerate(strip_comments(path.read_text()).splitlines(), 1):
            for spec in IMPORT_SPEC.findall(line):
                target = None
                for app in APP_NAMES:
                    if spec == f"{SCOPE_NAME}/{app}" or spec.startswith(f"{SCOPE_NAME}/{app}/"):
                        target = app
                if spec.startswith("."):
                    resolved = (path.parent / spec).resolve()
                    try:
                        resolved_parts = resolved.relative_to(root.resolve()).parts
                    except ValueError:
                        resolved_parts = ()
                    if len(resolved_parts) > 1 and resolved_parts[0] == "apps":
                        target = resolved_parts[1]
                if target and target != own_app:
                    violations.append(Violation(rel, number, f"app '{own_app}' imports app '{target}'"))
    return violations


# --- check: no-versioned-env (since C) --------------------------------------

ENV_FILE = re.compile(r"(^|/)\.env$")


def check_no_versioned_env(root: Path) -> list[Violation]:
    """No .env file is tracked by git (claude-code-rules.md §1.2)."""
    return [Violation(name, 1, ".env file is versioned") for name in tracked_files(root) if ENV_FILE.search(name)]


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
DECLARATION = re.compile(
    r"\b(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)"
    r"|^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:(?!:)",
    re.M,
)


def split_identifier(name: str) -> list[str]:
    spaced = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", name.replace("_", " ").replace("$", " "))
    return [word.lower() for word in spaced.split() if word]


def strip_strings(source: str) -> str:
    """Blank out string and template literal contents, keeping line numbers."""
    return re.sub(
        r"(['\"`])(?:\\.|(?!\1).)*?\1",
        lambda m: m.group(1) + re.sub(r"[^\n]", " ", m.group(0)[1:-1]) + m.group(1),
        source,
        flags=re.S,
    )


def check_english_identifiers(root: Path) -> list[Violation]:
    """Identifiers are in English (D-84): declarations and object/interface keys."""
    violations = []
    for path in code_files(root):
        rel = relative(root, path)
        source = strip_strings(strip_comments(path.read_text()))
        for match in DECLARATION.finditer(source):
            name = match.group(1) or match.group(2)
            words = [w for w in split_identifier(name) if w in PORTUGUESE_WORDS]
            if words:
                number = source.count("\n", 0, match.start()) + 1
                violations.append(Violation(rel, number, f"identifier '{name}' uses Portuguese word(s) {words}"))
    return violations


CHECKS: dict[str, Callable[[Path], list[Violation]]] = {
    "no-direct-data-access": check_no_direct_data_access,
    "no-cross-app-import": check_no_cross_app_import,
    "no-versioned-env": check_no_versioned_env,
    "english-identifiers": check_english_identifiers,
}


def run_checks(root: Path) -> int:
    failed = 0
    for name, check in CHECKS.items():
        violations = check(root)
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
    """Each check must catch the deliberate violation in its fixture (MASTER-PLAN.md, gate 2)."""
    failed = 0
    for name, check in CHECKS.items():
        fixture = FIXTURES / name
        if not fixture.is_dir():
            print(f"FAIL {name}: missing fixture {fixture.relative_to(REPO_ROOT)}")
            failed += 1
            continue
        violations = check(fixture)
        if violations:
            print(f"ok   {name} catches {len(violations)} violation(s), e.g. {violations[0]}")
        else:
            print(f"FAIL {name}: fixture produced no violation")
            failed += 1
    print(f"\nself-test: {len(CHECKS) - failed}/{len(CHECKS)} checks catch their fixture")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--self-test", action="store_true", help="prove each check catches its fixture")
    args = parser.parse_args()
    return self_test() if args.self_test else run_checks(REPO_ROOT)


if __name__ == "__main__":
    sys.exit(main())
