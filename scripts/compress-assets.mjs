import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brotliCompress, constants, gzip } from 'node:zlib';
import { promisify } from 'node:util';

const brotli = promisify(brotliCompress);
const gzipAsync = promisify(gzip);
const directory = new URL('../dist/assets/', import.meta.url);
for (const filename of await readdir(directory)) {
  if (!/\.(js|css)$/.test(filename)) continue;
  const path = join(directory.pathname, filename);
  const source = await readFile(path);
  const [br, gz] = await Promise.all([
    brotli(source, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }),
    gzipAsync(source, { level: 9 })
  ]);
  await Promise.all([writeFile(`${path}.br`, br), writeFile(`${path}.gz`, gz)]);
  console.log(`${filename}: ${source.length} bytes → ${br.length} Brotli / ${gz.length} gzip`);
}
