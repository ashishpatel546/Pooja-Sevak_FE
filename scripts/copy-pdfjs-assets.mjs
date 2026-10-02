// Copies pdf.js' standard fonts, CMaps and WebAssembly decoders to public/pdfjs
// so the in-app PDF viewer renders uncommon fonts, CJK text and JPEG 2000
// images. Runs on install and before dev/build, so the files always match the
// installed pdfjs-dist version.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pdfjs-dist');
const dest = join(root, 'public', 'pdfjs');

if (!existsSync(src)) process.exit(0);
rmSync(dest, { recursive: true, force: true });
for (const dir of ['standard_fonts', 'cmaps', 'wasm']) {
  cpSync(join(src, dir), join(dest, dir), { recursive: true });
}
