// Reprints a TypeScript file through the compiler's printer: the CLI's generated types come out
// unformatted, and a deterministic layout keeps the committed file readable and diffable.
//   node format-ts.mjs <file>
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../../../package.json', import.meta.url))
const ts = require('typescript')

const [path] = process.argv.slice(2)
if (!path) {
  console.error('usage: node format-ts.mjs <file>')
  process.exit(1)
}
const source = readFileSync(path, 'utf8')
const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
writeFileSync(path, printer.printFile(file))
