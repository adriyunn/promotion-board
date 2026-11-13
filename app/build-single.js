// Inlines docs/ (CSS, JS modules, JSON data, icon) into one self-contained offline HTML file.
const fs = require('fs');
const path = require('path');
const DOCS = path.join(__dirname, '..', 'docs');
const OUT = path.join(__dirname, '..', 'Steadfast_Board_Prep_offline.html');
const read = (rel) => fs.readFileSync(path.join(DOCS, rel), 'utf8');

// Modules in dependency order (each only imports from earlier ones).
const MODULES = ['js/store.js', 'js/quiz.js', 'js/ui.js', 'js/views/session.js', 'js/views/home.js', 'js/views/topics.js',
  'js/views/test.js', 'js/views/library.js', 'js/views/progress.js', 'js/views/results.js', 'js/views/board.js', 'js/app.js'];
const varName = (rel) => '__m_' + path.basename(rel, '.js');
const resolve = (from, spec) => path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));

function wrap(rel) {
  let src = read(rel);
  const exportsList = [];
  src = src.replace(/^import \* as (\w+) from '([^']+)';$/gm, (_, name, spec) => `const ${name} = ${varName(resolve(rel, spec))};`);
  src = src.replace(/^import \{([^}]+)\} from '([^']+)';$/gm, (_, names, spec) => `const {${names}} = ${varName(resolve(rel, spec))};`);
  src = src.replace(/^export (async function|function|const|let) (\w+)/gm, (_, kind, name) => { exportsList.push(name); return `${kind} ${name}`; });
  if (/^\s*(import|export)\b/m.test(src)) throw new Error(`unhandled import/export in ${rel}`);
  return `const ${varName(rel)} = (() => {\n${src}\nreturn { ${exportsList.join(', ')} };\n})();`;
}

function build() {
  for (const rel of fs.readdirSync(path.join(DOCS, 'js/views')).map((f) => 'js/views/' + f)) if (!MODULES.includes(rel)) throw new Error(`module not listed: ${rel}`);
  let html = read('index.html');
  const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(DOCS, 'icons/icon-192.png')).toString('base64');
  const data = `window.__BANK__ = ${read('data/bank.json')};\nwindow.__LIBRARY__ = ${read('data/library.json')};`;
  const js = MODULES.map(wrap).join('\n\n').replace(/<\/script/gi, '<\\/script');
  html = html
    .replace('<link rel="manifest" href="manifest.webmanifest">\n', '')
    .replace(/<link rel="apple-touch-icon" href="[^"]+">/, `<link rel="apple-touch-icon" href="${icon}">`)
    .replace(/<link rel="icon" href="[^"]+">/, `<link rel="icon" href="${icon}">`)
    .replace('<link rel="stylesheet" href="css/app.css">', () => `<style>\n${read('css/app.css')}\n</style>`)
    .replace(/<script type="module" src="js\/app.js"><\/script>\n<script>[^<]*<\/script>/, () => `<script>\n${data.replace(/<\/script/gi, '<\\/script')}\n</script>\n<script>\n${js}\n</script>`);
  if (/src="js\/|href="css\//.test(html)) throw new Error('external reference left in single file');
  fs.writeFileSync(OUT, html);
  console.log(`${path.basename(OUT)}: ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
}

build();
