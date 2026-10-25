"""Copy legacy files to their new home and rewrite '@/...' imports (foundation.md §D)."""
import os, re, sys, json, shutil

REPO = '/home/user/monorepo-portal_dos_interprete-ts'
LEG = 'legacy/src/'
SCOPE = '@portal-dos-interpretes'

# legacy module (without extension, relative to legacy/src) -> new location (package-relative path without ext)
# A destination is (package_dir, path_inside_src)
MAP = json.load(open(os.path.join(os.path.dirname(__file__), 'map.json')))

def dest_of(mod):
    """Return (pkgdir, subpath) for a legacy module path, or None if app-local."""
    if mod in MAP: return MAP[mod]
    if mod.startswith('components/ui/'): return ['packages/ui', 'components/' + mod.split('/')[-1]]
    if mod.startswith('assets/'): return ['packages/ui', mod]
    return None

def pkg_name(pkgdir):
    return f"{SCOPE}/{pkgdir.split('/')[-1]}"

def specifier(from_pkgdir, from_sub, target):
    pkgdir, sub = target
    if pkgdir == from_pkgdir:
        rel = os.path.relpath(sub, os.path.dirname(from_sub))
        return rel if rel.startswith('.') else './' + rel
    if pkgdir.startswith('apps/'):
        raise SystemExit(f'cross-app import to {target}')
    return f"{pkg_name(pkgdir)}/{sub}"

ROUTES_FILE = os.environ.get('ROUTES')
ROUTES = json.load(open(ROUTES_FILE)) if ROUTES_FILE else {}
OLD_PATH = re.compile(r"(?<=['\"`])(/dashboard/[a-z]+(?:/[A-Za-z0-9_-]+)*)")


def rewrite_routes(text):
    """Old dashboard paths -> the app's new paths, longest prefix first (architecture.md §3)."""
    if not ROUTES:
        return text
    def repl(m):
        path = m.group(1)
        for old in sorted(ROUTES, key=len, reverse=True):
            if path == old or path.startswith(old + '/'):
                return ROUTES[old] + path[len(old):] if ROUTES[old] != '/' or path == old else path[len(old):]
        return path
    return OLD_PATH.sub(repl, text)


IMPORT = re.compile(r"""((?:from|import)\s*\(?\s*)(['"])@/([^'"]+)\2""")

def rewrite(text, from_pkgdir, from_sub, app_local_pkgdir):
    def repl(m):
        mod = m.group(3)
        mod_noext = re.sub(r'\.(tsx?|jsx?)$', '', mod)
        target = dest_of(mod_noext) or dest_of(mod)
        if target is None:
            if from_pkgdir.startswith('apps/'):
                return m.group(0)  # app-local: '@/' alias stays valid
            raise SystemExit(f'{from_pkgdir}/{from_sub}: unmapped import @/{mod}')
        return f"{m.group(1)}{m.group(2)}{specifier(from_pkgdir, from_sub, target)}{m.group(2)}"
    return IMPORT.sub(repl, text)

def copy(mod_with_ext, pkgdir, sub_with_ext):
    src = os.path.join(REPO, LEG, mod_with_ext)
    dst = os.path.join(REPO, pkgdir, 'src', sub_with_ext)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if src.endswith(('.ts', '.tsx', '.js', '.jsx')):
        text = open(src).read()
        text = rewrite_routes(rewrite(text, pkgdir, sub_with_ext, pkgdir))
        # exactOptionalPropertyTypes: Lucide icons pass className as string | undefined.
        text = text.replace('ComponentType<{ className?: string }>', 'ComponentType<{ className?: string | undefined }>')
        open(dst, 'w').write(text)
    else:
        shutil.copyfile(src, dst)
    print(f'{LEG}{mod_with_ext} -> {pkgdir}/src/{sub_with_ext}')

if __name__ == '__main__':
    # usage: move.py <pkgdir> <legacy path with ext> [<sub path with ext>]
    pkgdir, mod = sys.argv[1], sys.argv[2]
    sub = sys.argv[3] if len(sys.argv) > 3 else mod
    copy(mod, pkgdir, sub)
