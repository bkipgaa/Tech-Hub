/**
 * rename-frontend.cjs
 * Renames WeBA-Hub -> Webalink in the FRONTEND ONLY. Never touches backend/.
 *
 * Run from the repo root (the folder that contains backend/ and frontend/):
 *     node rename-frontend.cjs            (apply)
 *     node rename-frontend.cjs --dry-run  (show what would change, write nothing)
 *
 * Safety:
 *  - Every special edit (Navbar, Footer, Home, AdminLogin) must match exactly or the
 *    script stops BEFORE writing anything, so you never end up half-renamed.
 *  - Only the text "WeBA-Hub" / "Weba-Hub" is replaced. URLs, emails, package names,
 *    localStorage keys and API addresses are lowercase/different and are not touched.
 *  - Requires frontend/src/components/Wordmark.jsx to exist (copy it in first).
 */
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry-run');
const SRC = path.join('frontend', 'src');
const fail = (m) => { console.error('\n✖ ' + m + '\nNothing was changed.'); process.exit(1); };

if (!fs.existsSync(SRC)) fail('Run this from the repo root (needs frontend/src).');
if (!fs.existsSync(path.join(SRC, 'components', 'Wordmark.jsx')))
  fail('frontend/src/components/Wordmark.jsx is missing. Copy it in first.');

// Already done? (Navbar imports the Wordmark and no old brand text remains there)
const navPath = path.join(SRC, 'components', 'Navbar.jsx');
if (fs.existsSync(navPath)) {
  const nav = fs.readFileSync(navPath, 'utf8');
  if (/import \{ Wordmark \}/.test(nav) && !/WeBA/.test(nav)) {
    console.log('The frontend already looks renamed to Webalink. Nothing to do.');
    process.exit(0);
  }
}

// ---------- collect files ----------
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : /\.(jsx?|css)$/.test(e.name) ? [p] : [];
});
const files = walk(SRC);
const original = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const next = new Map(original);
const notes = [];

// ---------- helpers ----------
const eolOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');
const edit = (file, fn) => {
  const f = path.join(SRC, file);
  if (!next.has(f)) fail(`Expected file not found: ${f}`);
  next.set(f, fn(next.get(f), eolOf(next.get(f))));
};
const mustReplace = (s, re, to, label) => {
  if (!re.test(s)) fail(`Could not find ${label}. The file differs from what I expected.`);
  return s.replace(re, to);
};
const addImport = (s, eol, line) => {
  if (s.includes(line)) return s;
  const m = s.match(/^import React[^\n]*\n/m);
  if (!m) fail('Could not find the React import line to add the Wordmark import after.');
  return s.replace(m[0], m[0].replace(/\r?\n$/, '') + eol + line + eol);
};

// ---------- 1. Special edits: two-colour "WeBA" + "-Hub" text becomes the Webalink wordmark ----------
const twoSpan = /<span className="text-xl font-bold[^"]*">\s*<span className="text-green-\d+">WeBA<\/span>\s*<span className="text-red-\d+">-Hub<\/span>\s*<\/span>/;

edit(path.join('components', 'Navbar.jsx'), (s, eol) => {
  s = mustReplace(s, twoSpan, '<Wordmark className="text-xl" />', 'the Navbar brand text');
  return addImport(s, eol, 'import { Wordmark } from "./Wordmark";');
});
edit(path.join('components', 'Footer.jsx'), (s, eol) => {
  s = mustReplace(s, twoSpan, '<Wordmark className="text-xl" onDark />', 'the Footer brand text');
  s = s.replace(/&copy; \{currentYear\} WeBA-Hub\./, '&copy; {currentYear} Webalink Limited.');
  if (/to="\/cookies"/.test(s)) { s = s.replace(/to="\/cookies"/g, 'to="/privacy#cookies"'); notes.push('Footer cookie link now points to /privacy#cookies'); }
  return addImport(s, eol, 'import { Wordmark } from "./Wordmark";');
});
edit(path.join('pages', 'Home.jsx'), (s, eol) => {
  s = mustReplace(s, /<span className="text-green-500">WeBA-Hub<\/span>/, '<Wordmark className="" onDark />', 'the Home hero title');
  return addImport(s, eol, "import { Wordmark } from '../components/Wordmark';");
});
edit(path.join('pages', 'Admin', 'AdminLogin.jsx'), (s, eol) => {
  s = mustReplace(s, /WeBA<span className="text-red-500">-Hub<\/span>/, '<Wordmark className="" onDark />', 'the AdminLogin title');
  return addImport(s, eol, "import { Wordmark } from '../../components/Wordmark';");
});

// ---------- 2. Everything else: exact text swap (case-sensitive) ----------
// The new legal files are skipped on purpose: legal.js keeps formerName: 'WeBA-Hub'
// so the Terms/Privacy pages can say "Webalink was previously known as WeBA-Hub".
const SKIP = (f) => /config[\\/]legal\.js$|components[\\/]legal[\\/]|pages[\\/](Terms|Privacy)\.jsx$/.test(f);
for (const [f, s] of next) if (!SKIP(f)) next.set(f, s.replace(/WeBA-Hub/g, 'Webalink').replace(/Weba-Hub/g, 'Webalink'));

// ---------- 3. index.html title ----------
const html = path.join('frontend', 'index.html');
let htmlNew = null;
if (fs.existsSync(html)) {
  const h = fs.readFileSync(html, 'utf8');
  if (/<title>frontend<\/title>/.test(h)) htmlNew = h.replace('<title>frontend</title>', '<title>Webalink</title>');
}

// ---------- 4. Optional syntax check (uses sucrase if it is installed) ----------
let sucrase = null;
try { sucrase = require(path.resolve('frontend', 'node_modules', 'sucrase')); } catch (_) {}
if (sucrase) {
  for (const [f, s] of next) {
    if (s === original.get(f) || !/\.jsx?$/.test(f)) continue;
    try { sucrase.transform(s, { transforms: ['jsx'] }); }
    catch (e) { fail(`Syntax check failed in ${f}: ${e.message}`); }
  }
} else notes.push('Syntax check skipped (sucrase not found). Run "npm run build" to confirm.');

// ---------- 5. Write ----------
const changed = [...next].filter(([f, s]) => s !== original.get(f)).map(([f]) => f);
console.log(`${DRY ? '[dry run] Would change' : 'Changing'} ${changed.length} file(s):`);
changed.forEach((f) => console.log('  ' + f));
if (htmlNew) console.log('  frontend/index.html (title)');
if (!DRY) {
  changed.forEach((f) => fs.writeFileSync(f, next.get(f), 'utf8'));
  if (htmlNew) fs.writeFileSync(html, htmlNew, 'utf8');
}
notes.forEach((n) => console.log('note: ' + n));

// ---------- 6. Report what is intentionally left ----------
console.log('\nLeft alone on purpose (backend, URLs, config):');
const left = [];
for (const [f, s] of next) if (!SKIP(f)) s.split(/\r?\n/).forEach((line, i) => {
  if (/weba-?hub|tech-hub/i.test(line)) left.push(`  ${f}:${i + 1}  ${line.trim().slice(0, 90)}`);
});
console.log(left.length ? left.join('\n') : '  (none)');
console.log('\nNext: replace the placeholder @webahub.com / @weba-hub.com emails with your real domain, then run "npm run dev" and "npm run build".');
