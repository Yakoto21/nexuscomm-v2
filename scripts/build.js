const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// Suporta resolução de módulos no diretório backend/node_modules ou raiz
const backendDir = path.resolve(__dirname, '..', 'backend');
const backendRequire = createRequire(path.join(backendDir, 'package.json'));

let esbuild;
let JavaScriptObfuscator;

try {
    esbuild = backendRequire('esbuild');
} catch (e) {
    esbuild = require('esbuild');
}

try {
    JavaScriptObfuscator = backendRequire('javascript-obfuscator');
} catch (e) {
    JavaScriptObfuscator = require('javascript-obfuscator');
}

async function buildFrontend() {
    console.log('🛡️ [NexusComm V2] Iniciando Sprint de Segurança Front-end...');
    console.log('⚙️ [Configuração] Source Maps: DESATIVADOS (sourcemap: false)');
    console.log('⚙️ [Configuração] Minificação: ATIVADA (minify: true, legalComments: none)');
    console.log('⚙️ [Configuração] Ofuscação AST: ATIVADA (hexadecimal, base64 strings, control flow flattening)');

    const rootDir = path.resolve(__dirname, '..');
    const frontendSrcDir = path.join(rootDir, 'frontend', 'src');
    const jsEntry = path.join(frontendSrcDir, 'js', 'app.js');
    const cssEntry = path.join(frontendSrcDir, 'styles', 'main.css');
    const htmlEntry = path.join(frontendSrcDir, 'index.html');

    const outputDirs = [
        path.join(rootDir, 'public'),
        path.join(rootDir, 'backend', 'public')
    ];

    // Certifica-se de que os diretórios de saída existem
    for (const outDir of outputDirs) {
        fs.mkdirSync(path.join(outDir, 'dist', 'js'), { recursive: true });
        fs.mkdirSync(path.join(outDir, 'dist', 'css'), { recursive: true });
    }

    // 1. Minificação de CSS com esbuild (sourcemap: false)
    console.log('\n🎨 1. Processando e minificando CSS...');
    const cssResult = await esbuild.build({
        entryPoints: [cssEntry],
        bundle: true,
        minify: true,
        sourcemap: false,
        legalComments: 'none',
        write: false
    });

    const minifiedCss = cssResult.outputFiles[0].text;
    console.log(`   ✓ CSS minificado gerado com sucesso (${Buffer.byteLength(minifiedCss, 'utf8')} bytes)`);

    // 2. Bundling e Minificação inicial de JS com esbuild (sourcemap: false)
    console.log('\n📦 2. Empacotando e minificando JavaScript inicial com esbuild...');
    const jsResult = await esbuild.build({
        entryPoints: [jsEntry],
        bundle: false,
        minify: true,
        sourcemap: false,
        legalComments: 'none',
        target: ['es2020'],
        format: 'iife',
        write: false
    });

    const preminifiedJs = jsResult.outputFiles[0].text;
    console.log(`   ✓ JS pré-minificado (${Buffer.byteLength(preminifiedJs, 'utf8')} bytes)`);

    // 3. Ofuscação avançada de AST com JavaScript Obfuscator (sourcemap: false)
    console.log('\n🔒 3. Aplicando ofuscação avançada (AST Obfuscator)...');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(preminifiedJs, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.6,
        numbersToExpressions: true,
        simplify: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.8,
        splitStrings: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        sourceMap: false,
        sourceMapMode: 'separate'
    });

    const obfuscatedJs = obfuscationResult.getObfuscatedCode();
    console.log(`   ✓ Código JS ofuscado com sucesso (${Buffer.byteLength(obfuscatedJs, 'utf8')} bytes)`);

    // 4. Preparação do index.html de produção
    console.log('\n📄 4. Compilando index.html de produção...');
    let htmlContent = fs.readFileSync(htmlEntry, 'utf8');

    // Remove comentários HTML desnecessários
    htmlContent = htmlContent.replace(/<!--[\s\S]*?-->/g, '');

    // 5. Escrevendo os arquivos nos diretórios public e backend/public
    console.log('\n💾 5. Gravando artefatos de distribuição...');
    for (const outDir of outputDirs) {
        // Grava JS Bundle ofuscado
        fs.writeFileSync(path.join(outDir, 'dist', 'js', 'app.bundle.js'), obfuscatedJs, 'utf8');
        // Grava CSS minificado
        fs.writeFileSync(path.join(outDir, 'dist', 'css', 'main.min.css'), minifiedCss, 'utf8');
        // Grava index.html de produção
        fs.writeFileSync(path.join(outDir, 'index.html'), htmlContent, 'utf8');

        // Limpeza: remove qualquer arquivo .map que possa ter existido anteriormente
        const mapFiles = [
            path.join(outDir, 'dist', 'js', 'app.bundle.js.map'),
            path.join(outDir, 'dist', 'css', 'main.min.css.map')
        ];
        for (const mapFile of mapFiles) {
            if (fs.existsSync(mapFile)) {
                fs.unlinkSync(mapFile);
                console.log(`   🧹 Arquivo de source map removido: ${mapFile}`);
            }
        }
    }

    // 6. Verificação de Integridade e Segurança
    console.log('\n✅ 6. Verificação de Segurança concluída:');
    const hasSourceMapUrlJs = obfuscatedJs.includes('sourceMappingURL');
    const hasSourceMapUrlCss = minifiedCss.includes('sourceMappingURL');

    if (!hasSourceMapUrlJs && !hasSourceMapUrlCss) {
        console.log('   🔒 [OK] Nenhuma referência a sourceMappingURL encontrada nos bundles.');
    } else {
        console.warn('   ⚠️ [ALERTA] Referência a source map detectada!');
    }

    const containsRawSourceTree = obfuscatedJs.includes('function verifyAuthAndInit') || obfuscatedJs.includes('getOrCreateMicrophone');
    if (!containsRawSourceTree) {
        console.log('   🔒 [OK] Nomes de funções originais foram ofuscados / remapeados para identificadores hexadecimais.');
    }

    console.log('\n🎉 Build de Produção concluído com segurança máxima!\n');
}

buildFrontend().catch((err) => {
    console.error('❌ Erro durante o build de produção:', err);
    process.exit(1);
});
