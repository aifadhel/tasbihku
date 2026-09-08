import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');
const ROUTER_JS_PATH = path.join(__dirname, '..', 'src', 'ui', 'router.js');
const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseVersion(vStr) {
  const match = vStr.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function bumpVersion(current, type) {
  const parsed = parseVersion(current);
  if (!parsed) throw new Error(`Invalid version format: ${current}`);

  let { major, minor, patch } = parsed;

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else if (type === 'patch') {
    patch += 1;
  } else if (/^\d+\.\d+\.\d+$/.test(type)) {
    const custom = parseVersion(type);
    major = custom.major;
    minor = custom.minor;
    patch = custom.patch;
  } else {
    throw new Error(`Unknown bump type: ${type}. Use 'patch', 'minor', 'major', or an explicit version string like '1.8.2'.`);
  }

  return `${major}.${minor}.${patch}`;
}

function run() {
  const args = process.argv.slice(2);
  const bumpType = args[0] || 'patch';
  const note = args.slice(1).join(' ') || 'Automated update and improvements.';

  // 1. Read package.json
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    throw new Error(`package.json not found at ${PACKAGE_JSON_PATH}`);
  }
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  const oldVersion = pkg.version || '1.8.1';
  const newVersion = bumpVersion(oldVersion, bumpType);
  const formattedTag = `tasbihku-v${newVersion}`;

  console.log(`Bumping version: ${oldVersion} -> ${newVersion} (${formattedTag})`);

  // 2. Update package.json
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  console.log(`[✓] Updated package.json version to ${newVersion}`);

  // 3. Update src/ui/router.js
  if (fs.existsSync(ROUTER_JS_PATH)) {
    let routerContent = fs.readFileSync(ROUTER_JS_PATH, 'utf-8');
    const versionRegex = /export const APP_VERSION = ['"][^'"]+['"];/;
    if (!versionRegex.test(routerContent)) {
      throw new Error(`Could not find APP_VERSION definition in ${ROUTER_JS_PATH}`);
    }
    routerContent = routerContent.replace(versionRegex, `export const APP_VERSION = '${newVersion}';`);
    fs.writeFileSync(ROUTER_JS_PATH, routerContent, 'utf-8');
    console.log(`[✓] Updated src/ui/router.js APP_VERSION to ${newVersion}`);
  } else {
    console.warn(`[!] src/ui/router.js not found at ${ROUTER_JS_PATH}`);
  }

  // 4. Update public/sw.js cache name
  if (fs.existsSync(SW_PATH)) {
    let swContent = fs.readFileSync(SW_PATH, 'utf-8');
    const cacheRegex = /const CACHE_NAME = ['"]tasbihku-v[^'"]+['"];/;
    if (!cacheRegex.test(swContent)) {
      throw new Error(`Could not find CACHE_NAME definition in ${SW_PATH}`);
    }
    swContent = swContent.replace(cacheRegex, `const CACHE_NAME = 'tasbihku-v${newVersion}';`);
    fs.writeFileSync(SW_PATH, swContent, 'utf-8');
    console.log(`[✓] Updated public/sw.js cache name to tasbihku-v${newVersion}`);
  } else {
    console.warn(`[!] public/sw.js not found at ${SW_PATH}`);
  }

  // 5. Update CHANGELOG.md
  let changelog = '';
  if (fs.existsSync(CHANGELOG_PATH)) {
    changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  } else {
    changelog = `# TasbihKu WebApp — Changelog\n\n`;
  }

  const today = getTodayString();
  const newReleaseBlock = `## [${formattedTag}] - ${today}\n\n- ${note}\n\n`;

  const firstHeaderIndex = changelog.search(/##\s+/);
  if (firstHeaderIndex !== -1) {
    changelog = changelog.slice(0, firstHeaderIndex) + newReleaseBlock + changelog.slice(firstHeaderIndex);
  } else {
    changelog += '\n' + newReleaseBlock;
  }

  fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf-8');
  console.log(`[✓] Updated CHANGELOG.md with entry [${formattedTag}] - ${today}`);
  console.log(`\nSuccess! TasbihKu bumped to ${formattedTag}`);
}

run();
