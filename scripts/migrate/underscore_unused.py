"""Prefix with "_" the unused parameters/destructured names that `tsc` reports (TS6133).

usage: python3 scripts/migrate/underscore_unused.py <package-or-app dir>
Only renames at the exact line/column tsc gives, and only when the name is followed by
":", ",", ")" or "}" there (a parameter or destructuring position), never a declaration.
"""
import os, re, subprocess, sys

pkg = sys.argv[1]
out = subprocess.run(['pnpm', 'exec', 'tsc', '-p', 'tsconfig.json', '--noEmit'], cwd=pkg, capture_output=True, text=True).stdout
pat = re.compile(r"^(.+?)\((\d+),(\d+)\): error TS6133: '([^']+)' is declared but its value is never read\.$", re.M)
edits = {}
for f, line, col, name in pat.findall(out):
    edits.setdefault(os.path.normpath(os.path.join(pkg, f)), []).append((int(line), int(col), name))
for path, items in edits.items():
    lines = open(path).read().split('\n')
    changed = False
    for line, col, name in sorted(items, reverse=True):
        text = lines[line - 1]
        if re.match(r'\s*import\b', text) or ' from ' in text:
            continue
        i = col - 1
        if text[i:i + len(name)] != name:
            continue
        rest = text[i + len(name):].lstrip()
        before = text[:i].rstrip()
        if rest[:1] in (':', ',', ')', '}', '?') or rest == '' or before.endswith(('(', ',', '{')):
            if before.endswith(('const', 'let', 'var', 'function')):
                continue
            lines[line - 1] = text[:i] + '_' + name + text[i + len(name):]
            changed = True
    if changed:
        open(path, 'w').write('\n'.join(lines))
        print('underscored', path)
