// The stock server serves both dist and public; a standalone local snapshot needs both.
import assert from 'node:assert/strict';
import {cpSync, existsSync, renameSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'tmp/startup-verified-dist');
const index = path.join(root, 'dist/index.html');
assert(existsSync(index), 'Build dist before publishing');
const options = {recursive: true, filter: (source) => path.basename(source) !== 'index.html'};
cpSync(path.join(root, 'public'), target, options);
cpSync(path.join(root, 'dist'), target, options);
for(const font of ['tgico.ttf', 'KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2']) {
  assert(existsSync(path.join(target, 'assets/fonts', font)), `Missing published font: ${font}`);
}
cpSync(index, path.join(target, 'index.html.next'));
renameSync(path.join(target, 'index.html.next'), path.join(target, 'index.html'));
console.log('Published dist with public assets; existing versioned chunks retained');
