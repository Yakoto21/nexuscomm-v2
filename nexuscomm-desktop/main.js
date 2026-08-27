const { app, BrowserWindow, shell, nativeTheme, session } = require('electron');
const path = require('path');

// Força tema escuro no processo nativo
nativeTheme.themeSource = 'dark';

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#0a0e1a', // Fundo escuro nativo para transição suave
        autoHideMenuBar: true,      // Oculta a barra de menu padrão (Windows/Linux)
        show: false,                // Inicia invisível para evitar flash em branco
        title: 'NexusComm',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            sandbox: true,
            spellcheck: true
        }
    });

    // 🔒 Concede permissões necessárias para WebRTC (microfone, câmera, tela e notificações)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'notifications', 'display-capture'];
        if (allowedPermissions.includes(permission)) {
            callback(true);
        } else {
            callback(false);
        }
    });

    // 🌐 Ponte Web: Carrega a aplicação de produção diretamente do Render
    mainWindow.loadURL('https://nexuscomm-v2.onrender.com');

    // Exibe a janela suavemente assim que o DOM e assets iniciais estiverem prontos
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Redireciona links externos para o navegador padrão do sistema operacional
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Inicialização do ciclo de vida da aplicação Electron
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Encerra a aplicação quando todas as janelas forem fechadas (exceto no macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
