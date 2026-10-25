"""Remove import specifiers that `tsc` reports as unused (TS6133/TS6192) in moved files.

usage: python3 scripts/migrate/prune_unused_imports.py <package-or-app dir>
Only touches import statements; any other unused declaration is left for a manual fix.
"""
import re, subprocess, sys, os

pkg = sys.argv[1]
out = subprocess.run(['pnpm', 'exec', 'tsc', '-p', 'tsconfig.json', '--noEmit'], cwd=pkg, capture_output=True, text=True).stdout
pat = re.compile(r"^(.+?)\((\d+),(\d+)\): error TS6133: '([^']+)' is declared but its value is never read\.$", re.M)
by_file = {}
for f, line, col, name in pat.findall(out):
    by_file.setdefault(os.path.normpath(os.path.join(pkg, f)), []).append((int(line), name))
for path, items in by_file.items():
    lines = open(path).read().split('\n')
    text = '\n'.join(lines)
    changed = False
    for line_no, name in items:
        # find the import statement containing this line
        offset = sum(len(l) + 1 for l in lines[: line_no - 1])
        start = text.rfind('import', 0, offset + len(lines[line_no - 1]))
        end = text.find(';', start)
        stmt_end = text.find('\n', end if end != -1 else start)
        m = re.match(r"import\s+(type\s+)?(\w+\s*,\s*)?\{([^}]*)\}\s*from\s*(['\"][^'\"]+['\"]);?", text[start:])
        if not m or start > offset + len(lines[line_no - 1]):
            continue
        names = [n.strip() for n in m.group(3).split(',') if n.strip()]
        keep = [n for n in names if re.split(r'\s+as\s+', n)[-1] != name]
        if len(keep) == len(names):
            continue
        default = m.group(2) or ''
        if keep:
            new = f"import {m.group(1) or ''}{default}{{ {', '.join(keep)} }} from {m.group(4)};"
        elif default:
            new = f"import {default.rstrip(', ')} from {m.group(4)};"
        else:
            new = ''
        text = text[:start] + new + text[start + m.end():]
        if new == '' and text[start:start + 1] == '\n':
            text = text[:start] + text[start + 1:]
        lines = text.split('\n')
        changed = True
    if changed:
        open(path, 'w').write(text)
        print('pruned', path)
