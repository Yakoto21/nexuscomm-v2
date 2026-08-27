# NexusComm Desktop (Electron App)

Aplicação nativa Desktop do NexusComm V2 empacotada com Electron.

## 🚀 Como Inicializar

1. Abra o terminal no diretório `nexuscomm-desktop`:
   ```bash
   cd nexuscomm-desktop
   ```

2. Instale o Electron:
   ```bash
   npm install
   ```
   *(ou `npm install electron --save-dev`)*

3. Inicialize o aplicativo Desktop:
   ```bash
   npm start
   ```

## ⚙️ Configurações Principais
- Dimensões padrão: 1200x800 (redimensionável, mínimo 900x600)
- Tema nativo: Escuro (`backgroundColor: '#0a0e1a'`)
- Barra de menu padrão oculta (`autoHideMenuBar: true`)
- Ponte Web: Aponta diretamente para `https://nexuscomm-v2.onrender.com`
- Permissões automáticas para WebRTC (Microfone, Câmera, Compartilhamento de Tela e Notificações)
