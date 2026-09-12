import { execFileSync } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { WorkspaceTypertGenerator } from '@deepseek-ai/dsh-typert-generator'

const root = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(root, 'packages', 'dsh-session-groups')
const output = join(packageRoot, 'lib')

await rm(output, { recursive: true, force: true })
await mkdir(join(output, 'types'), { recursive: true })

execFileSync(process.execPath, [
  join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  '-p', join(packageRoot, 'tsconfig.host.json'),
], { cwd: root, stdio: 'inherit' })

await build({
  entryPoints: [join(packageRoot, 'src', 'index.ts')],
  outfile: join(output, 'index.js'),
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
})

const [artifact] = new WorkspaceTypertGenerator(root)
  .generate(['dsh-session-groups'], ['host'])
if (artifact === undefined || artifact.remote === undefined) {
  throw new Error('Typert did not generate the dsh-session-groups Remote contribution')
}
await writeFile(join(output, 'typert.host.js'), artifact.js)
await writeFile(join(output, 'typert.host.d.ts'), artifact.dts)
await writeFile(join(output, 'typert.remote-client.js'), artifact.remote.js)
await writeFile(join(output, 'typert.remote-client.d.ts'), artifact.remote.dts)
await writeFile(join(output, 'typert.remote-client.d.ts.map'), artifact.remote.dtsMap)

execFileSync(process.execPath, [
  join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  '-p', join(packageRoot, 'tsconfig.client.json'),
  '--noEmit',
], { cwd: root, stdio: 'inherit' })

execFileSync(process.execPath, [
  join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  '-p', join(packageRoot, 'tsconfig.client.json'),
  '--noEmit', 'false',
  '--declaration',
  '--emitDeclarationOnly',
  '--outDir', join(output, 'types'),
], { cwd: root, stdio: 'inherit' })
await writeFile(join(output, 'types', 'types.js'), 'export {}\n')

const client = await build({
  entryPoints: [join(packageRoot, 'src', 'client', 'index.tsx')],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'cjs',
  target: ['chrome120'],
  jsx: 'automatic',
  loader: { '.svg': 'text' },
  external: [
    'react',
    'react/jsx-runtime',
    '@deepseek-ai/dsh-client-ui-primitives',
  ],
})
const body = client.outputFiles[0]?.text
if (body === undefined) throw new Error('client bundle emitted no JavaScript')
const wrapped = [
  'window.__ModuleLoader__.load({',
  '  id: "dsh-session-groups",',
  '  factory: (require) => {',
  '    var module = { exports: {} };',
  '    var exports = module.exports;',
  body,
  '    return module.exports;',
  '  }',
  '});',
  '',
].join('\n')
await writeFile(join(output, 'client.js'), wrapped)

const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
if (manifest.version === undefined) throw new Error('package version is missing')
