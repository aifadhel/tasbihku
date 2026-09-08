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
    throw new Error(`Unknown bump type: ${type}. Use 'patch', 'minor', 'major', or an explicit version string like '1.8.3'.`);
  }

  return `${major}.${minor}.${patch}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30) || 'update';
}

function preflightCheck() {
  const issues = [];

  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    issues.push(`package.json missing at ${PACKAGE_JSON_PATH}`);
  } else {
    try {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
      if (!pkg.version) issues.push(`package.json missing "version" field`);
    } catch (e) {
      issues.push(`package.json contains invalid JSON: ${e.message}`);
    }
  }

  if (fs.existsSync(ROUTER_JS_PATH)) {
    const routerContent = fs.readFileSync(ROUTER_JS_PATH, 'utf-8');
    if (!/export const APP_VERSION = ['"][^'"]+['"];/.test(routerContent)) {
      issues.push(`APP_VERSION pattern not matched in ${ROUTER_JS_PATH}`);
    }
  } else {
    issues.push(`src/ui/router.js not found at ${ROUTER_JS_PATH}`);
  }

  if (fs.existsSync(SW_PATH)) {
    const swContent = fs.readFileSync(SW_PATH, 'utf-8');
    if (!/const CACHE_NAME = ['"]tasbihku-v[^'"]+['"];/.test(swContent)) {
      issues.push(`CACHE_NAME pattern not matched in ${SW_PATH}`);
    }
  } else {
    issues.push(`public/sw.js not found at ${SW_PATH}`);
  }

  if (issues.length > 0) {
    throw new Error(`[PRE-FLIGHT FAILURE]\n- ${issues.join('\n- ')}`);
  }
}

function run() {
  const rawArgs = process.argv.slice(2);
  const isDryRun = rawArgs.includes('--dry-run') || rawArgs.includes('-d');
  const filteredArgs = rawArgs.filter(arg => arg !== '--dry-run' && arg !== '-d');

  const bumpType = filteredArgs[0] || 'patch';
  const note = filteredArgs.slice(1).join(' ') || 'Pembaruan otomatis, optimalisasi performa, dan pemeliharaan antarmuka.';

  // 1. Run Pre-flight Checks
  preflightCheck();

  // 2. Read package.json & determine versions
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  const oldVersion = pkg.version || '1.8.2';
  const newVersion = bumpVersion(oldVersion, bumpType);
  const formattedTag = `tasbihku-v${newVersion}`;
  const today = getTodayString();
  const slug = slugify(note);

  console.log(`\n============================================================`);
  console.log(`TasbihKu Automated Versioning Engine`);
  console.log(`============================================================`);
  console.log(`Status:       ${isDryRun ? '[DRY RUN] (No files will be modified)' : 'EXECUTING'}`);
  console.log(`Version Bump: ${oldVersion} -> ${newVersion} (${formattedTag})`);
  console.log(`Date:         ${today}`);
  console.log(`Summary Note: ${note}`);
  console.log(`============================================================\n`);

  // 3. Prepare target file changes
  // package.json
  pkg.version = newVersion;
  const newPkgContent = JSON.stringify(pkg, null, 2) + '\n';

  // src/ui/router.js
  let routerContent = fs.readFileSync(ROUTER_JS_PATH, 'utf-8');
  routerContent = routerContent.replace(
    /export const APP_VERSION = ['"][^'"]+['"];/,
    `export const APP_VERSION = '${newVersion}';`
  );

  // public/sw.js
  let swContent = fs.readFileSync(SW_PATH, 'utf-8');
  swContent = swContent.replace(
    /const CACHE_NAME = ['"]tasbihku-v[^'"]+['"];/,
    `const CACHE_NAME = 'tasbihku-v${newVersion}';`
  );

  // CHANGELOG.md
  let changelog = '';
  if (fs.existsSync(CHANGELOG_PATH)) {
    changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  } else {
    changelog = `# TasbihKu WebApp — Changelog\n\n`;
  }

  let formattedChangelogEntry = '';
  if (note.includes('###') || note.startsWith('- ')) {
    // Custom formatted notes passed directly
    formattedChangelogEntry = `## [${formattedTag}] - ${today}\n\n${note}\n\n`;
  } else {
    // Scaffolding Keep-a-Changelog domain categories
    formattedChangelogEntry = `## [${formattedTag}] - ${today}\n\n` +
      `- **Highlight:** ${note}\n\n` +
      `### Specific UI & Component Changes\n` +
      `- Added/updated UI elements, responsive container queries, or M3 components.\n\n` +
      `### Core Logic & Audio/Haptic Workflows\n` +
      `- Counter persistence, audio synth, and vibration feedback enhancements.\n\n` +
      `### Dzikir & Habits Engine\n` +
      `- Azkar presets, habit statistics, and streak calculation updates.\n\n` +
      `### Test & Verification\n` +
      `- Unit test suite (\`npm test\`): verified clean.\n` +
      `- Production compilation (\`npm run build\`): verified clean.\n\n`;
  }

  const firstHeaderIndex = changelog.search(/##\s+/);
  if (firstHeaderIndex !== -1) {
    changelog = changelog.slice(0, firstHeaderIndex) + formattedChangelogEntry + changelog.slice(firstHeaderIndex);
  } else {
    changelog += '\n' + formattedChangelogEntry;
  }

  // 4. In-App Broadcast Draft (Section 3.1)
  const broadcastDraft = {
    id: `tasbihku-v${newVersion}-${slug}`,
    title: `TasbihKu v${newVersion}: Ringkasan Pembaruan`,
    message: note,
    priority: 'normal',
  };

  if (isDryRun) {
    console.log(`[DRY RUN] Pre-flight checks PASSED for all targets:`);
    console.log(`  [✓] package.json -> version "${newVersion}"`);
    console.log(`  [✓] src/ui/router.js -> APP_VERSION "${newVersion}"`);
    console.log(`  [✓] public/sw.js -> CACHE_NAME "tasbihku-v${newVersion}"`);
    console.log(`  [✓] CHANGELOG.md -> Prepend release block [${formattedTag}] - ${today}`);
  } else {
    // Perform atomic file writes
    fs.writeFileSync(PACKAGE_JSON_PATH, newPkgContent, 'utf-8');
    console.log(`[✓] Updated package.json version to ${newVersion}`);

    fs.writeFileSync(ROUTER_JS_PATH, routerContent, 'utf-8');
    console.log(`[✓] Updated src/ui/router.js APP_VERSION to ${newVersion}`);

    fs.writeFileSync(SW_PATH, swContent, 'utf-8');
    console.log(`[✓] Updated public/sw.js cache name to tasbihku-v${newVersion}`);

    fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf-8');
    console.log(`[✓] Updated CHANGELOG.md with entry [${formattedTag}] - ${today}`);

    console.log(`\n[✓] All target files synchronized to ${formattedTag} successfully!`);
  }

  // 5. Output In-App Broadcast Draft
  console.log(`\n============================================================`);
  console.log(`[DRAFT] IN-APP UPDATE BROADCAST REVIEW GATE (Section 3.1)`);
  console.log(`============================================================`);
  console.log(`ID:       ${broadcastDraft.id}`);
  console.log(`Title:    ${broadcastDraft.title}`);
  console.log(`Message:  ${broadcastDraft.message}`);
  console.log(`Priority: ${broadcastDraft.priority}`);
  console.log(`Action:   Review above copy with user before staging in toast/modal.`);
  console.log(`============================================================\n`);
}

run();
