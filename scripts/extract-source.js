const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const originalIndexHtmlPath = path.join(rootDir, 'public', 'index.html');
const content = fs.readFileSync(originalIndexHtmlPath, 'utf8');

// Identify regions
const styleStartTag = '<style>';
const styleEndTag = '</style>';
const styleStart = content.indexOf(styleStartTag);
const styleEnd = content.indexOf(styleEndTag);

const socketScriptTag = '<script src="/socket.io/socket.io.js"></script>';
const socketIdx = content.indexOf(socketScriptTag);
const scriptStartTag = '<script>';
const scriptStart = content.indexOf(scriptStartTag, socketIdx);
const scriptEnd = content.lastIndexOf('</script>');

if (styleStart === -1 || styleEnd === -1 || scriptStart === -1 || scriptEnd === -1) {
    console.error('Failed to locate regions in public/index.html');
    process.exit(1);
}

// 1. Extract CSS
const cssContent = content.substring(styleStart + styleStartTag.length, styleEnd).trim();

// 2. Extract JS
const jsContent = content.substring(scriptStart + scriptStartTag.length, scriptEnd).trim();

// 3. Extract HTML Template
const htmlBeforeStyle = content.substring(0, styleStart);
const htmlBetweenStyleAndSocket = content.substring(styleEnd + styleEndTag.length, socketIdx);
const htmlAfterScript = content.substring(scriptEnd + '</script>'.length);

const templateHtml = `${htmlBeforeStyle}<!-- CSS Bundle injected during build -->
    <link rel="stylesheet" href="/dist/css/main.min.css">
${htmlBetweenStyleAndSocket}<script src="/socket.io/socket.io.js"></script>
    <!-- Obfuscated & Minified JS Bundle injected during build -->
    <script src="/dist/js/app.bundle.js"></script>
${htmlAfterScript}`;

// Ensure frontend/src directories exist
const frontendDir = path.join(rootDir, 'frontend');
const frontendSrc = path.join(frontendDir, 'src');
const stylesDir = path.join(frontendSrc, 'styles');
const jsDir = path.join(frontendSrc, 'js');

fs.mkdirSync(stylesDir, { recursive: true });
fs.mkdirSync(jsDir, { recursive: true });

// Write extracted files
fs.writeFileSync(path.join(frontendSrc, 'index.html'), templateHtml, 'utf8');
fs.writeFileSync(path.join(stylesDir, 'main.css'), cssContent, 'utf8');
fs.writeFileSync(path.join(jsDir, 'app.js'), jsContent, 'utf8');

console.log('Successfully extracted frontend source files:');
console.log(' - frontend/src/index.html');
console.log(' - frontend/src/styles/main.css (' + cssContent.length + ' bytes)');
console.log(' - frontend/src/js/app.js (' + jsContent.length + ' bytes)');
