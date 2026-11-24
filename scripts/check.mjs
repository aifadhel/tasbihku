import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { buildCodemapText, parseContractHeader } from './codemap.mjs';

const ROOT = fs.realpathSync(process.cwd());
const args = process.argv.slice(2);
const errors = [];

const countLines = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

function walkFiles(dir, extFilter) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, extFilter));
    else if (!extFilter || extFilter(full)) out.push(full);
  }
  return out;
}

function checkHygiene(file, allowLocalStorage = false) {
  const text = fs.readFileSync(file, 'utf8');
  if (/^\s*window\.[a-zA-Z0-9_$]+\s*=/m.test(text)) {
    errors.push(`[HYGIENE] window.* assignment forbidden in ${rel(file)}`);
  }
  if (!allowLocalStorage && /\blocalStorage\b/.test(text) && !file.endsWith('.test.js')) {
    errors.push(`[HYGIENE] direct localStorage access forbidden in ${rel(file)}`);
  }
}

function checkShell() {
  const dirs = [path.join(ROOT, 'src', 'app'), path.join(ROOT, 'src', 'shared')];
  for (const d of dirs) {
    for (const f of walkFiles(d, (p) => p.endsWith('.js'))) {
      const lines = countLines(f);
      if (lines > 200) errors.push(`[LINE] ${rel(f)} has ${lines}L (max 200L)`);
      checkHygiene(f, f.endsWith(path.join('shared', 'storage.js')));
    }
  }
}

function checkI18n() {
  const coreJson = path.join(ROOT, 'src', 'shared', 'i18n-core.json');
  const featureJsons = walkFiles(path.join(ROOT, 'src', 'features'), (p) => p.endsWith('.i18n.json'));
  const files = [...(fs.existsSync(coreJson) ? [coreJson] : []), ...featureJsons];
  for (const f of files) {
    const lines = countLines(f);
    if (lines > 150) errors.push(`[I18N] ${rel(f)} has ${lines}L (max 150L)`);
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    const idKeys = Object.keys(data.id || {}).sort();
    const enKeys = Object.keys(data.en || {}).sort();
    if (JSON.stringify(idKeys) !== JSON.stringify(enKeys)) {
      errors.push(`[I18N] id/en key mismatch in ${rel(f)}`);
    }
  }
}

function checkCss() {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (/<style[\s>]/i.test(indexHtml)) errors.push('[CSS] inline <style> forbidden in index.html');
  const cssFiles = [
    path.join(ROOT, 'style.css'),
    ...walkFiles(path.join(ROOT, 'src', 'styles'), (p) => p.endsWith('.css')),
    ...walkFiles(path.join(ROOT, 'src', 'features'), (p) => p.endsWith('.css'))
  ].filter((f) => fs.existsSync(f));
  for (const f of cssFiles) {
    const lines = countLines(f);
    if (lines > 200) errors.push(`[CSS] ${rel(f)} has ${lines}L (max 200L)`);
    if (f.includes(`${path.sep}features${path.sep}`)) {
      const text = fs.readFileSync(f, 'utf8');
      if (!/@layer\s+features\b/.test(text)) {
        errors.push(`[CSS] ${rel(f)} must wrap rules in @layer features`);
      }
    }
  }
}

function checkFeature(name) {
  const dir = path.join(ROOT, 'src', 'features', name);
  if (!fs.existsSync(dir)) return errors.push(`[FEATURE] missing ${rel(dir)}`);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) errors.push(`[FLAT] nested folder forbidden: ${rel(path.join(dir, entry.name))}`);
  }
  const contractFile = path.join(dir, `${name}.contract.js`);
  if (!fs.existsSync(contractFile)) errors.push(`[CONTRACT] missing ${rel(contractFile)}`);
  else {
    const cLines = countLines(contractFile);
    if (cLines > 60) errors.push(`[CONTRACT] ${rel(contractFile)} has ${cLines}L (max 60L)`);
    const meta = parseContractHeader(contractFile);
    if (!meta || meta.name !== name) errors.push(`[CONTRACT] invalid @feature header in ${rel(contractFile)}`);
    const cText = fs.readFileSync(contractFile, 'utf8');
    if (/\bimport\s+/.test(cText)) errors.push(`[CONTRACT] zero runtime imports allowed in ${rel(contractFile)}`);
  }
  for (const f of walkFiles(dir, (p) => p.endsWith('.js') || p.endsWith('.css'))) {
    if (path.basename(f) === 'index.js') errors.push(`[BARREL] barrel index.js forbidden: ${rel(f)}`);
    const lines = countLines(f);
    if (lines > 200) errors.push(`[LINE] ${rel(f)} has ${lines}L (max 200L)`);
    if (f.endsWith('.js')) {
      checkHygiene(f, false);
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1];
        if (spec.includes('/features/') && !spec.endsWith('.contract.js')) {
          errors.push(`[ISOLATION] cross-feature non-contract import "${spec}" in ${rel(f)}`);
        }
      }
    }
  }
}

function checkSize() {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'size.config.json'), 'utf8'));
  const assetsDir = path.join(ROOT, 'dist', 'assets');
  if (!fs.existsSync(assetsDir)) return errors.push('[SIZE] dist/assets missing; run npm run build');
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.endsWith('.js') && !name.endsWith('.css')) continue;
    const gz = zlib.gzipSync(fs.readFileSync(path.join(assetsDir, name))).length;
    if (name === 'index.js' && gz > cfg.shellJsMaxGzBytes) {
      errors.push(`[SIZE] assets/index.js ${gz}B gz > ${cfg.shellJsMaxGzBytes}B`);
    } else if (name === 'index.css' && gz > cfg.shellCssMaxGzBytes) {
      errors.push(`[SIZE] assets/index.css ${gz}B gz > ${cfg.shellCssMaxGzBytes}B`);
    } else if (name !== 'index.js' && name !== 'index.css' && gz > cfg.lazyChunkMaxGzBytes) {
      errors.push(`[SIZE] assets/${name} ${gz}B gz > ${cfg.lazyChunkMaxGzBytes}B`);
    }
  }
}

function checkSelf() {
  if (!fs.existsSync(path.join(ROOT, 'size.config.json'))) errors.push('[SELF] missing size.config.json');
  if (!fs.existsSync(path.join(ROOT, 'CODEMAP.md'))) errors.push('[SELF] missing CODEMAP.md');
  if (countLines(path.join(ROOT, 'scripts', 'check.mjs')) > 200) errors.push('[SELF] scripts/check.mjs > 200L');
}

function checkFull() {
  checkSelf();
  checkShell();
  checkI18n();
  checkCss();
  const featuresDir = path.join(ROOT, 'src', 'features');
  const features = fs.existsSync(featuresDir)
    ? fs.readdirSync(featuresDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    : [];
  if (features.length === 0) errors.push('[FEATURE] no features found under src/features/');
  features.forEach(checkFeature);
  const mainJs = path.join(ROOT, 'src', 'main.js');
  if (countLines(mainJs) > 200) errors.push(`[LINE] src/main.js has ${countLines(mainJs)}L (max 200L)`);
  checkHygiene(mainJs, false);
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (/\son(?:click|change|input|keydown|submit)=/i.test(indexHtml)) {
    errors.push('[HTML] inline on*= handlers forbidden in index.html');
  }
  for (const legacy of ['core', 'hardware', 'ui', 'modules']) {
    if (fs.existsSync(path.join(ROOT, 'src', legacy))) {
      errors.push(`[LEGACY] src/${legacy} must be removed after migration`);
    }
  }
  const expectedMap = buildCodemapText();
  const actualMap = fs.existsSync(path.join(ROOT, 'CODEMAP.md'))
    ? fs.readFileSync(path.join(ROOT, 'CODEMAP.md'), 'utf8') : '';
  if (expectedMap !== actualMap) errors.push('[CODEMAP] CODEMAP.md stale; run npm run codemap');
}

if (args.includes('--self')) checkSelf();
else if (args.includes('--shell')) checkShell();
else if (args.includes('--i18n')) checkI18n();
else if (args.includes('--css')) checkCss();
else if (args.includes('--size')) checkSize();
else if (args.includes('--feature')) {
  const idx = args.indexOf('--feature');
  const fname = args[idx + 1];
  if (!fname) errors.push('[CLI] --feature requires feature name');
  else checkFeature(fname);
} else checkFull();

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`CHECK FAIL scope=${args.join(' ') || 'full'} exit=1`);
  process.exit(1);
}
console.log(`CHECK PASS scope=${args.join(' ') || 'full'} exit=0`);
