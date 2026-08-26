// 1. Gerenciamento do Token de Autenticação JWT e Usuário Ativo
        let authToken = localStorage.getItem('nexuscomm_jwt_token') || '';
        let currentUser = null; // { id, username, display_name, avatar_url }

        // Elementos DOM do Portão de Autenticação (Auth Gate)
        const authGateContainer = document.getElementById('authGateContainer');
        const authGateAlert = document.getElementById('authGateAlert');
        const tabGateLogin = document.getElementById('tabGateLogin');
        const tabGateRegister = document.getElementById('tabGateRegister');
        const tabGateToken = document.getElementById('tabGateToken');
        const formGateLogin = document.getElementById('formGateLogin');
        const formGateRegister = document.getElementById('formGateRegister');
        const formGateToken = document.getElementById('formGateToken');
        const gateLoginUsername = document.getElementById('gateLoginUsername');
        const gateLoginPassword = document.getElementById('gateLoginPassword');
        const gateRegisterUsername = document.getElementById('gateRegisterUsername');
        const gateRegisterPassword = document.getElementById('gateRegisterPassword');
        const gateTokenInput = document.getElementById('gateTokenInput');
        const btnSubmitGateLogin = document.getElementById('btnSubmitGateLogin');
        const btnSubmitGateRegister = document.getElementById('btnSubmitGateRegister');
        const btnSubmitGateToken = document.getElementById('btnSubmitGateToken');

        // Root da Aplicação (Gating Absoluto)
        const appRoot = document.getElementById('appRoot');

        // Elementos Cabeçalho & UX
        const mainServerHeading = document.getElementById('mainServerHeading');
        const mainHeaderSub = document.getElementById('mainHeaderSub');
        const toastCopied = document.getElementById('toastCopied');
        const btnCopyChannelLink = document.getElementById('btnCopyChannelLink');
        const emptyStateContainer = document.getElementById('emptyStateContainer');
        const btnEmptyStateCopy = document.getElementById('btnEmptyStateCopy');
        const authenticatedUserBadge = document.getElementById('authenticatedUserBadge');
        const authenticatedUsername = document.getElementById('authenticatedUsername');
        const btnLogout = document.getElementById('btnLogout');

        // Estágios de Visualização
        const communityWelcomeView = document.getElementById('communityWelcomeView');
        const welcomeServerAvatar = document.getElementById('welcomeServerAvatar');
        const welcomeServerTitle = document.getElementById('welcomeServerTitle');
        const btnQuickEnterGeneralText = document.getElementById('btnQuickEnterGeneralText');
        const btnQuickEnterGeneralVoice = document.getElementById('btnQuickEnterGeneralVoice');

        const mainTextChatView = document.getElementById('mainTextChatView');
        const mainChatChannelName = document.getElementById('mainChatChannelName');
        const mainChatChannelTopic = document.getElementById('mainChatChannelTopic');
        const channelWelcomeHeading = document.getElementById('channelWelcomeHeading');
        const channelWelcomeDesc = document.getElementById('channelWelcomeDesc');
        const mainChatMessagesList = document.getElementById('mainChatMessagesList');
        const mainChatExpandedForm = document.getElementById('mainChatExpandedForm');
        const mainChatExpandedInput = document.getElementById('mainChatExpandedInput');

        // Elementos de Anexo de Mídia (Sprint 4)
        const inputAttachMainChat = document.getElementById('inputAttachMainChat');
        const btnAttachMainChat = document.getElementById('btnAttachMainChat');
        const mainChatMediaPreview = document.getElementById('mainChatMediaPreview');
        const mainChatMediaPreviewImg = document.getElementById('mainChatMediaPreviewImg');
        const mainChatMediaPreviewName = document.getElementById('mainChatMediaPreviewName');
        const mainChatMediaPreviewSize = document.getElementById('mainChatMediaPreviewSize');
        const btnRemoveMainChatMedia = document.getElementById('btnRemoveMainChatMedia');

        const inputAttachDm = document.getElementById('inputAttachDm');
        const btnAttachDm = document.getElementById('btnAttachDm');
        const dmMediaPreview = document.getElementById('dmMediaPreview');
        const dmMediaPreviewImg = document.getElementById('dmMediaPreviewImg');
        const dmMediaPreviewName = document.getElementById('dmMediaPreviewName');
        const dmMediaPreviewSize = document.getElementById('dmMediaPreviewSize');
        const btnRemoveDmMedia = document.getElementById('btnRemoveDmMedia');

        const inputAttachSide = document.getElementById('inputAttachSide');
        const btnAttachSide = document.getElementById('btnAttachSide');
        const sideMediaPreview = document.getElementById('sideMediaPreview');
        const sideMediaPreviewImg = document.getElementById('sideMediaPreviewImg');
        const sideMediaPreviewName = document.getElementById('sideMediaPreviewName');
        const sideMediaPreviewSize = document.getElementById('sideMediaPreviewSize');
        const btnRemoveSideMedia = document.getElementById('btnRemoveSideMedia');

        let pendingMainChatMedia = null; // { file, base64, name, size }
        let pendingDmMedia = null;
        let pendingSideMedia = null;

        const voiceStageView = document.getElementById('voiceStageView');
        const voiceChannelHeading = document.getElementById('voiceChannelHeading');
        const voiceParticipantsCount = document.getElementById('voiceParticipantsCount');

        // Servidores & Canais
        const btnServerHome = document.getElementById('btnServerHome');
        const serversList = document.getElementById('serversList');
        const btnOpenAddServerModal = document.getElementById('btnOpenAddServerModal');
        const modalAddServer = document.getElementById('modalAddServer');
        const btnCloseServerModal = document.getElementById('btnCloseServerModal');
        const btnCancelServerModal = document.getElementById('btnCancelServerModal');
        const formAddServer = document.getElementById('formAddServer');
        const inputServerName = document.getElementById('inputServerName');
        const serverModalAlert = document.getElementById('serverModalAlert');
        const btnSubmitServerModal = document.getElementById('btnSubmitServerModal');

        const channelsSidebar = document.getElementById('channels-sidebar');
        const channelsSidebarHeader = document.getElementById('channelsSidebarHeader');
        const selectedServerTitle = document.getElementById('selectedServerTitle');
        const btnOpenServerHome = document.getElementById('btnOpenServerHome');
        const btnOpenServerSettings = document.getElementById('btnOpenServerSettings');
        const textChannelsList = document.getElementById('textChannelsList');
        const voiceChannelsList = document.getElementById('voiceChannelsList');
        const btnOpenAddChannelModal = document.getElementById('btnOpenAddChannelModal');
        const modalAddChannel = document.getElementById('modalAddChannel');
        const btnCloseChannelModal = document.getElementById('btnCloseChannelModal');
        const btnCancelChannelModal = document.getElementById('btnCancelChannelModal');
        const formAddChannel = document.getElementById('formAddChannel');
        const inputChannelName = document.getElementById('inputChannelName');
        const channelModalAlert = document.getElementById('channelModalAlert');
        const btnSubmitChannelModal = document.getElementById('btnSubmitChannelModal');
        const optTypeText = document.getElementById('optTypeText');
        const optTypeVoice = document.getElementById('optTypeVoice');
        const userBarAvatar = document.getElementById('userBarAvatar');
        const userBarName = document.getElementById('userBarName');
        const userBarMuteBtn = document.getElementById('userBarMuteBtn');

        // Elementos de Configurações de Canal (Sprint: Personalização de Canais)
        const modalChannelSettings = document.getElementById('modalChannelSettings');
        const channelSettingsSubtitle = document.getElementById('channelSettingsSubtitle');
        const btnCloseChannelSettingsModal = document.getElementById('btnCloseChannelSettingsModal');
        const formEditChannel = document.getElementById('formEditChannel');
        const inputEditChannelName = document.getElementById('inputEditChannelName');
        const channelSettingsAlert = document.getElementById('channelSettingsAlert');
        const btnCancelEditChannel = document.getElementById('btnCancelEditChannel');
        const btnSaveChannelName = document.getElementById('btnSaveChannelName');
        const btnDeleteChannel = document.getElementById('btnDeleteChannel');
        let editingChannelObj = null;

        // Elementos de Convite (Sprint de Convites)
        const btnOpenInviteModal = document.getElementById('btnOpenInviteModal');
        const modalInviteServer = document.getElementById('modalInviteServer');
        const btnCloseInviteModal = document.getElementById('btnCloseInviteModal');
        const inviteModalServerName = document.getElementById('inviteModalServerName');
        const inputInviteUrl = document.getElementById('inputInviteUrl');
        const btnCopyInviteUrl = document.getElementById('btnCopyInviteUrl');
        const iconCopyInvite = document.getElementById('iconCopyInvite');
        const labelCopyInvite = document.getElementById('labelCopyInvite');
        const inviteModalExpiryNotice = document.getElementById('inviteModalExpiryNotice');
        const modalAcceptInvite = document.getElementById('modalAcceptInvite');
        const acceptInviteServerAvatar = document.getElementById('acceptInviteServerAvatar');
        const acceptInviteInviter = document.getElementById('acceptInviteInviter');
        const acceptInviteServerName = document.getElementById('acceptInviteServerName');
        const acceptInviteMemberCount = document.getElementById('acceptInviteMemberCount');
        const acceptInviteAlert = document.getElementById('acceptInviteAlert');
        const btnDeclineInviteModal = document.getElementById('btnDeclineInviteModal');
        const btnConfirmAcceptInvite = document.getElementById('btnConfirmAcceptInvite');
        let pendingInviteCode = null;

        // Elementos da Barra Lateral de Membros (Sprint de Membros & Hierarquia)
        const membersSidebar = document.getElementById('membersSidebar');
        const membersListContainer = document.getElementById('membersListContainer');
        const membersCountBadge = document.getElementById('membersCountBadge');
        const btnToggleMembersSidebar = document.getElementById('btnToggleMembersSidebar');
        let currentServerMembersList = [];

        // Elementos de Indicador de Digitação (Epic Sprint: Interatividade)
        const channelTypingIndicator = document.getElementById('channelTypingIndicator');
        const sideChatTypingIndicator = document.getElementById('sideChatTypingIndicator');
        const dmTypingIndicator = document.getElementById('dmTypingIndicator');
        const activeTypingUsersMap = new Map();
        let mainChatTypingTimer = null;
        let isMainChatTyping = false;
        let sideChatTypingTimer = null;
        let isSideChatTyping = false;
        let dmTypingTimer = null;
        let isDmTyping = false;

        // Elementos da Interface de Administração (Server Settings)
        const serverSettingsOverlay = document.getElementById('serverSettingsOverlay');
        const btnCloseServerSettings = document.getElementById('btnCloseServerSettings');
        const settingsServerNameNav = document.getElementById('settingsServerNameNav');
        const settingsServerAvatar = document.getElementById('settingsServerAvatar');

        const tabSettingsOverview = document.getElementById('tabSettingsOverview');
        const tabSettingsRolesMembers = document.getElementById('tabSettingsRolesMembers');
        const tabSettingsRoles = document.getElementById('tabSettingsRoles');
        const tabSettingsMembers = document.getElementById('tabSettingsMembers');

        const panelSettingsOverview = document.getElementById('panelSettingsOverview');
        const panelSettingsRolesMembers = document.getElementById('panelSettingsRolesMembers');
        const panelSettingsRoles = document.getElementById('panelSettingsRoles');
        const panelSettingsMembers = document.getElementById('panelSettingsMembers');

        const formServerOverview = document.getElementById('formServerOverview');
        const inputEditServerName = document.getElementById('inputEditServerName');
        const settingsOverviewAlert = document.getElementById('settingsOverviewAlert');
        const btnSaveServerOverview = document.getElementById('btnSaveServerOverview');
        const settingsRolesListContainer = document.getElementById('settingsRolesListContainer');
        const settingsMembersListContainer = document.getElementById('settingsMembersListContainer');
        const settingsRolesMembersListContainer = document.getElementById('settingsRolesMembersListContainer');

        // Controles de Upload de Mídia do Servidor (Ícone & Banner Supabase Storage)
        const inputServerIconFile = document.getElementById('inputServerIconFile');
        const btnUploadServerIcon = document.getElementById('btnUploadServerIcon');
        const btnRemoveServerIcon = document.getElementById('btnRemoveServerIcon');

        const settingsServerBannerPreview = document.getElementById('settingsServerBannerPreview');
        const settingsServerBannerPlaceholder = document.getElementById('settingsServerBannerPlaceholder');
        const inputServerBannerFile = document.getElementById('inputServerBannerFile');
        const btnUploadServerBanner = document.getElementById('btnUploadServerBanner');
        const btnRemoveServerBanner = document.getElementById('btnRemoveServerBanner');

        let pendingServerIconBase64 = null;
        let pendingServerBannerBase64 = null;

        // Elementos de Configurações de Usuário (User Profile Settings Modal)
        const userSettingsOverlay = document.getElementById('userSettingsOverlay');
        const btnOpenUserSettings = document.getElementById('btnOpenUserSettings');
        const btnCloseUserSettings = document.getElementById('btnCloseUserSettings');
        const btnCancelUserSettings = document.getElementById('btnCancelUserSettings');
        const formUserSettings = document.getElementById('formUserSettings');
        const inputUserDisplayName = document.getElementById('inputUserDisplayName');
        const inputUserUsernameDisplay = document.getElementById('inputUserUsernameDisplay');
        const userSettingsAvatarPreview = document.getElementById('userSettingsAvatarPreview');
        const inputUserAvatarFile = document.getElementById('inputUserAvatarFile');
        const btnUploadUserAvatar = document.getElementById('btnUploadUserAvatar');
        const btnRemoveUserAvatar = document.getElementById('btnRemoveUserAvatar');
        const userSettingsAlert = document.getElementById('userSettingsAlert');
        const btnSaveUserSettings = document.getElementById('btnSaveUserSettings');

        // Elementos de Configuração de Efeitos Sonoros (Sprint de Feedback Auditivo)
        const switchSoundEffects = document.getElementById('switchSoundEffects');
        const sliderSoundVolume = document.getElementById('sliderSoundVolume');
        const labelSoundVolume = document.getElementById('labelSoundVolume');
        const btnTestSoundJoin = document.getElementById('btnTestSoundJoin');
        const btnTestSoundLeave = document.getElementById('btnTestSoundLeave');
        const btnTestSoundMsg = document.getElementById('btnTestSoundMsg');
        const btnTestSoundMute = document.getElementById('btnTestSoundMute');

        let pendingUserAvatarBase64 = null;

        // Elementos do Hub Social (Home / Amigos / DMs - Sprint 3)
        const serverPanel = document.getElementById('serverPanel');
        const homePanel = document.getElementById('homePanel');
        const btnHomeNavFriends = document.getElementById('btnHomeNavFriends');
        const badgePendingDmsSidebar = document.getElementById('badgePendingDmsSidebar');
        const homeDmsList = document.getElementById('homeDmsList');
        const userBarAvatarHome = document.getElementById('userBarAvatarHome');
        const userBarNameHome = document.getElementById('userBarNameHome');
        const userBarMuteBtnHome = document.getElementById('userBarMuteBtnHome');
        const btnOpenUserSettingsHome = document.getElementById('btnOpenUserSettingsHome');
        const authenticatedUsernameHome = document.getElementById('authenticatedUsernameHome');
        const btnLogoutHome = document.getElementById('btnLogoutHome');

        const tabFriendsOnline = document.getElementById('tabFriendsOnline');
        const tabFriendsAll = document.getElementById('tabFriendsAll');
        const tabFriendsPending = document.getElementById('tabFriendsPending');
        const tabFriendsAdd = document.getElementById('tabFriendsAdd');
        const countFriendsOnline = document.getElementById('countFriendsOnline');
        const countFriendsAll = document.getElementById('countFriendsAll');
        const countFriendsPending = document.getElementById('countFriendsPending');

        const viewFriendsList = document.getElementById('viewFriendsList');
        const viewFriendsAdd = document.getElementById('viewFriendsAdd');
        const inputSearchFriends = document.getElementById('inputSearchFriends');
        const friendsListSectionTitle = document.getElementById('friendsListSectionTitle');
        const friendsListContainer = document.getElementById('friendsListContainer');

        const formAddFriend = document.getElementById('formAddFriend');
        const inputAddFriendUsername = document.getElementById('inputAddFriendUsername');
        const btnSubmitAddFriend = document.getElementById('btnSubmitAddFriend');
        const addFriendAlert = document.getElementById('addFriendAlert');

        // Elementos de Chat DM & Chamadas Privadas (Sprint 3 - Parte 2)
        const homeStageTopbar = document.getElementById('homeStageTopbar');
        const homeStageContent = document.getElementById('homeStageContent');
        const viewDirectMessageChat = document.getElementById('viewDirectMessageChat');
        const btnDmBackToFriends = document.getElementById('btnDmBackToFriends');
        const dmFriendAvatar = document.getElementById('dmFriendAvatar');
        const dmFriendStatusDot = document.getElementById('dmFriendStatusDot');
        const dmFriendName = document.getElementById('dmFriendName');
        const dmFriendTag = document.getElementById('dmFriendTag');
        const dmFriendPresenceText = document.getElementById('dmFriendPresenceText');
        const btnDmStartVoiceCall = document.getElementById('btnDmStartVoiceCall');
        const btnDmStartVideoCall = document.getElementById('btnDmStartVideoCall');

        const dmChatMessagesContainer = document.getElementById('dmChatMessagesContainer');
        const dmWelcomeBanner = document.getElementById('dmWelcomeBanner');
        const dmWelcomeAvatar = document.getElementById('dmWelcomeAvatar');
        const dmWelcomeTitle = document.getElementById('dmWelcomeTitle');
        const dmWelcomeDesc = document.getElementById('dmWelcomeDesc');
        const dmMessagesList = document.getElementById('dmMessagesList');
        const formDmChat = document.getElementById('formDmChat');
        const inputDmMessage = document.getElementById('inputDmMessage');

        // Overlay de Chamada Privada WebRTC
        const dmPrivateCallOverlay = document.getElementById('dmPrivateCallOverlay');
        const dmCallStatusBadge = document.getElementById('dmCallStatusBadge');
        const dmCallTimer = document.getElementById('dmCallTimer');
        const btnDmEndCall = document.getElementById('btnDmEndCall');
        const dmLocalVideo = document.getElementById('dmLocalVideo');
        const dmLocalPlaceholder = document.getElementById('dmLocalPlaceholder');
        const dmLocalPlaceholderAvatar = document.getElementById('dmLocalPlaceholderAvatar');
        const dmLocalUserBadge = document.getElementById('dmLocalUserBadge');
        const dmRemoteVideo = document.getElementById('dmRemoteVideo');
        const dmRemotePlaceholder = document.getElementById('dmRemotePlaceholder');
        const dmRemotePlaceholderAvatar = document.getElementById('dmRemotePlaceholderAvatar');
        const dmRemotePlaceholderText = document.getElementById('dmRemotePlaceholderText');
        const dmRemoteUserBadge = document.getElementById('dmRemoteUserBadge');

        // Modal de Chamada Recebida
        const modalIncomingCall = document.getElementById('modalIncomingCall');
        const incomingCallAvatar = document.getElementById('incomingCallAvatar');
        const incomingCallUsername = document.getElementById('incomingCallUsername');
        const incomingCallType = document.getElementById('incomingCallType');
        const btnAcceptIncomingCall = document.getElementById('btnAcceptIncomingCall');
        const btnDeclineIncomingCall = document.getElementById('btnDeclineIncomingCall');

        // Controles de Vídeo / Mídia
        const videoGrid = document.getElementById('videoGrid');
        const localVideo = document.getElementById('localVideo');
        const localStatusBadge = document.getElementById('localStatusBadge');
        const localPlaceholder = document.getElementById('localPlaceholder');
        const localFloatMic = document.getElementById('localFloatMic');
        const localFloatCam = document.getElementById('localFloatCam');
        const controlDock = document.getElementById('controlDock');
        const btnCamera = document.getElementById('btnCamera');
        const cameraIcon = document.getElementById('cameraIcon');
        const btnScreen = document.getElementById('btnScreen');
        const screenIcon = document.getElementById('screenIcon');
        const btnMute = document.getElementById('btnMute');
        const micIcon = document.getElementById('micIcon');
        const btnLeaveRoom = document.getElementById('btnLeaveRoom');

        // Modal de Screen Share & Slider de Sensibilidade de Microfone (Sprint 5)
        const modalScreenShareSettings = document.getElementById('modalScreenShareSettings');
        const btnCloseScreenModal = document.getElementById('btnCloseScreenModal');
        const btnCancelScreenModal = document.getElementById('btnCancelScreenModal');
        const formScreenShareSettings = document.getElementById('formScreenShareSettings');
        const optRes720 = document.getElementById('optRes720');
        const optRes1080 = document.getElementById('optRes1080');
        const optFps15 = document.getElementById('optFps15');
        const optFps30 = document.getElementById('optFps30');
        const optFps60 = document.getElementById('optFps60');
        const checkScreenAudio = document.getElementById('checkScreenAudio');
        const sliderMicSensitivity = document.getElementById('sliderMicSensitivity');
        const labelMicSensitivity = document.getElementById('labelMicSensitivity');

        // Docks Persistentes de Voz em Segundo Plano (Sprint 6)
        const persistentVoiceDock = document.getElementById('persistentVoiceDock');
        const persistentVoiceChannelName = document.getElementById('persistentVoiceChannelName');
        const btnReturnToVoiceStage = document.getElementById('btnReturnToVoiceStage');
        const btnPersistentMute = document.getElementById('btnPersistentMute');
        const btnPersistentDisconnect = document.getElementById('btnPersistentDisconnect');

        const persistentVoiceDockHome = document.getElementById('persistentVoiceDockHome');
        const persistentVoiceChannelNameHome = document.getElementById('persistentVoiceChannelNameHome');
        const btnReturnToVoiceStageHome = document.getElementById('btnReturnToVoiceStageHome');
        const btnPersistentMuteHome = document.getElementById('btnPersistentMuteHome');
        const btnPersistentDisconnectHome = document.getElementById('btnPersistentDisconnectHome');

        const chatSidebar = document.getElementById('chatSidebar');
        const chatPanelTitle = document.getElementById('chatPanelTitle');
        const btnToggleChat = document.getElementById('btnToggleChat');
        const btnCloseChat = document.getElementById('btnCloseChat');
        const chatMessages = document.getElementById('chatMessages');
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        const chatUnreadDot = document.getElementById('chatUnreadDot');

        const socketDot = document.getElementById('socketDot');
        const socketStatusText = document.getElementById('socketStatusText');
        const webrtcStatusText = document.getElementById('webrtcStatusText');

        // Inicialização do Socket.IO com Resiliência Avançada e Reconexão Progressiva
        const socket = io({
            auth: {
                token: authToken,
                username: currentUser?.username || ''
            },
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            timeout: 20000
        });

        // Fila de Mensagens (Message Queue) para resiliência offline/queda de rede
        const pendingMessageQueue = [];

        // Identidade do Usuário e Utilitários de UI
        let currentAuthUser = localStorage.getItem('nexuscomm_username') || 'Você';

        function getServerInitials(name) {
            if (!name || typeof name !== 'string') return 'NX';
            const clean = name.replace(/<[^>]*>?/gm, '').trim();
            if (!clean) return 'NX';
            const words = clean.split(/\s+/).filter(w => w.length > 0);
            if (words.length >= 2 && words[0].length > 0 && words[1].length > 0) {
                return (words[0][0] + words[1][0]).toUpperCase();
            }
            return clean.substring(0, 2).toUpperCase();
        }

        function updateCurrentUserUI(user) {
            try {
                if (!user && !currentUser) {
                    const storedUsername = localStorage.getItem('nexuscomm_username');
                    if (storedUsername) {
                        currentUser = { username: storedUsername };
                    }
                }
                const activeUser = user || currentUser;
                if (!activeUser) return;

                const displayName = activeUser.display_name || activeUser.username || localStorage.getItem('nexuscomm_username') || 'Usuário';
                currentAuthUser = displayName;

                if (userBarName) {
                    userBarName.textContent = displayName;
                }
                if (userBarNameHome) {
                    userBarNameHome.textContent = displayName;
                }

                const topAuthUserEl = authenticatedUsername || document.getElementById('authenticatedUsername');
                if (topAuthUserEl) {
                    topAuthUserEl.textContent = displayName;
                }

                const topAuthUserHomeEl = authenticatedUsernameHome || document.getElementById('authenticatedUsernameHome');
                if (topAuthUserHomeEl) {
                    topAuthUserHomeEl.textContent = displayName;
                }

                if (userBarAvatar) {
                    userBarAvatar.textContent = '';
                    if (activeUser.avatar_url) {
                        const img = document.createElement('img');
                        img.src = activeUser.avatar_url;
                        img.className = 'user-avatar-img';
                        img.alt = displayName;
                        userBarAvatar.appendChild(img);
                    } else {
                        userBarAvatar.textContent = getServerInitials(displayName);
                    }
                }

                if (userBarAvatarHome) {
                    userBarAvatarHome.textContent = '';
                    if (activeUser.avatar_url) {
                        const img = document.createElement('img');
                        img.src = activeUser.avatar_url;
                        img.className = 'user-avatar-img';
                        img.alt = displayName;
                        userBarAvatarHome.appendChild(img);
                    } else {
                        userBarAvatarHome.textContent = getServerInitials(displayName);
                    }
                }
            } catch (err) {
                console.warn('Aviso ao atualizar barra de usuário:', err);
            }
        }

        socket.on('authenticated', (data) => {
            console.log('✅ Identidade confirmada pelo servidor:', data);
            if (data.username && !currentUser) {
                currentUser = { username: data.username, id: data.userId };
                updateCurrentUserUI(currentUser);
            }
        });

        // Estruturas de Estado
        let currentViewMode = 'empty'; // 'empty' | 'text' | 'voice'
        let currentRoom = null;
        let currentTextRoom = null; // Sala de texto ativa independente
        let currentVoiceRoom = null; // Sala de voz WebRTC ativa independente
        let currentActiveChannelObj = null;
        let activeTextChannelObj = null;
        let activeVoiceChannelObj = null;
        let activeServerId = null;
        let activeServerObj = null;
        let activeChannelId = null;
        let selectedChannelTypeForModal = 'texto';
        let loadedServers = [];
        let loadedChannels = [];
        let loadedServerRoles = [];
        let loadedServerMembers = [];

        // Estado do Hub Social (Amigos & DMs)
        let currentSocialTab = 'online'; // 'online' | 'all' | 'pending' | 'add'
        let cachedFriendships = { accepted: [], pending_incoming: [], pending_outgoing: [], blocked: [] };
        let onlineUserIdsSet = new Set();
        let activeDmUserId = null;
        let activeDmFriendObj = null;

        // Estado de Chamadas Privadas P2P (WebRTC DM)
        let isPrivateCallActive = false;
        let privateCallRoom = null;
        let activePrivateCallPeer = null; // { targetUserId, targetSocketId, isVideo }
        let pendingIncomingCallData = null;
        let privateCallTimerInterval = null;
        let privateCallStartTime = null;

        let cameraStream = null;
        let micStream = null;
        let screenStream = null;
        let activeVideoType = 'none';
        let isMicMuted = false;
        let isChatOpen = false;
        let unreadCount = 0;

        const peerConnections = {}; 
        const remoteStreams = {}; 
        const iceCandidateQueues = {}; 
        const peerUsernames = {}; 
        const localStream = new MediaStream();

        // Configuração de NAT Traversal Avançada com múltiplos servidores STUN públicos (Sprint 6)
        const rtcConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:stun.services.mozilla.com' },
                { urls: 'stun:stun.cloudflare.com:3478' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ],
            iceCandidatePoolSize: 10
        };

        // ==========================================
        // 1. Gestão de Visibilidade do Palco Central
        // ==========================================
        function setViewMode(mode) {
            currentViewMode = mode;
            communityWelcomeView.classList.remove('active');
            mainTextChatView.classList.remove('active');
            voiceStageView.classList.remove('active');

            if (mode === 'empty') {
                communityWelcomeView.classList.add('active');
                if (controlDock) controlDock.style.display = 'none';
                if (chatSidebar.classList.contains('open')) toggleChatSidebar(false);
            } else if (mode === 'text') {
                mainTextChatView.classList.add('active');
                if (controlDock) controlDock.style.display = 'none';
                if (chatSidebar.classList.contains('open')) toggleChatSidebar(false);
                setTimeout(() => mainChatExpandedInput?.focus(), 100);
            } else if (mode === 'voice') {
                voiceStageView.classList.add('active');
                if (controlDock) controlDock.style.display = 'flex';
                updateGridLayout();
            }

            // Gerencia os docks persistentes de voz em segundo plano (Sprint 6)
            updatePersistentVoiceDocks();
        }

        function updatePersistentVoiceDocks() {
            const hasActiveVoice = Boolean(currentVoiceRoom && activeVoiceChannelObj);
            const isVoiceViewActive = (currentViewMode === 'voice');

            if (hasActiveVoice && !isVoiceViewActive) {
                if (persistentVoiceDock) persistentVoiceDock.style.display = 'flex';
                if (persistentVoiceDockHome) persistentVoiceDockHome.style.display = 'flex';
                if (persistentVoiceChannelName) persistentVoiceChannelName.innerText = `#${activeVoiceChannelObj?.nome || 'voz'}`;
                if (persistentVoiceChannelNameHome) persistentVoiceChannelNameHome.innerText = `#${activeVoiceChannelObj?.nome || 'voz'}`;
            } else {
                if (persistentVoiceDock) persistentVoiceDock.style.display = 'none';
                if (persistentVoiceDockHome) persistentVoiceDockHome.style.display = 'none';
            }
        }

        // ==========================================
        // 2. Administração do Servidor em Tela Cheia (Discord Style) & Upload de Mídia
        // ==========================================
        function openServerSettings() {
            if (!activeServerObj) {
                alert('Selecione um servidor para abrir as configurações.');
                return;
            }

            pendingServerIconBase64 = null;
            pendingServerBannerBase64 = null;

            settingsServerNameNav.innerText = activeServerObj.nome;
            inputEditServerName.value = activeServerObj.nome;
            settingsOverviewAlert.style.display = 'none';

            // Renderiza Ícone atual ou Iniciais
            renderSettingsAvatarPreview(activeServerObj.icon_url, activeServerObj.nome);

            // Renderiza Banner atual ou Placeholder
            renderSettingsBannerPreview(activeServerObj.banner_url);

            // Abre na aba Visão Geral por padrão
            switchSettingsTab('overview');

            serverSettingsOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            console.log(`⚙️ Configurações abertas para: ${activeServerObj.nome}`);
        }

        function renderSettingsAvatarPreview(iconUrl, serverName) {
            settingsServerAvatar.textContent = '';
            if (iconUrl) {
                const img = document.createElement('img');
                img.src = iconUrl;
                img.className = 'server-icon-img';
                img.alt = 'Ícone do Servidor';
                settingsServerAvatar.appendChild(img);
            } else {
                settingsServerAvatar.textContent = getServerInitials(serverName);
            }
        }

        function renderSettingsBannerPreview(bannerUrl) {
            if (bannerUrl) {
                settingsServerBannerPreview.style.background = `url('${bannerUrl}') center/cover no-repeat`;
                if (settingsServerBannerPlaceholder) settingsServerBannerPlaceholder.style.display = 'none';
            } else {
                settingsServerBannerPreview.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(14, 165, 233, 0.15))';
                if (settingsServerBannerPlaceholder) settingsServerBannerPlaceholder.style.display = 'flex';
            }
        }

        function closeServerSettings() {
            if (serverSettingsOverlay) {
                serverSettingsOverlay.classList.remove('open');
                document.body.style.overflow = 'auto';
            }
        }

        if (btnOpenServerSettings) btnOpenServerSettings.addEventListener('click', openServerSettings);
        if (btnCloseServerSettings) btnCloseServerSettings.addEventListener('click', closeServerSettings);

        // Tecla ESC para fechar as configurações
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (serverSettingsOverlay && serverSettingsOverlay.classList.contains('open')) {
                    closeServerSettings();
                }
                if (userSettingsOverlay && userSettingsOverlay.classList.contains('open')) {
                    closeUserSettings();
                }
            }
        });

        // Alternância de Abas nas Configurações
        function switchSettingsTab(tabName) {
            if (tabSettingsOverview) tabSettingsOverview.classList.remove('active');
            if (tabSettingsRolesMembers) tabSettingsRolesMembers.classList.remove('active');
            if (tabSettingsRoles) tabSettingsRoles.classList.remove('active');
            if (tabSettingsMembers) tabSettingsMembers.classList.remove('active');

            if (panelSettingsOverview) panelSettingsOverview.classList.remove('active');
            if (panelSettingsRolesMembers) panelSettingsRolesMembers.classList.remove('active');
            if (panelSettingsRoles) panelSettingsRoles.classList.remove('active');
            if (panelSettingsMembers) panelSettingsMembers.classList.remove('active');

            if (tabName === 'overview') {
                if (tabSettingsOverview) tabSettingsOverview.classList.add('active');
                if (panelSettingsOverview) panelSettingsOverview.classList.add('active');
            } else if (tabName === 'roles-members') {
                if (tabSettingsRolesMembers) tabSettingsRolesMembers.classList.add('active');
                if (panelSettingsRolesMembers) panelSettingsRolesMembers.classList.add('active');
                loadServerRolesAndMembersInSettings();
            } else if (tabName === 'roles') {
                if (tabSettingsRoles) tabSettingsRoles.classList.add('active');
                if (panelSettingsRoles) panelSettingsRoles.classList.add('active');
                loadServerRolesInSettings();
            } else if (tabName === 'members') {
                if (tabSettingsMembers) tabSettingsMembers.classList.add('active');
                if (panelSettingsMembers) panelSettingsMembers.classList.add('active');
                loadServerMembersInSettings();
            }
        }

        if (tabSettingsOverview) tabSettingsOverview.addEventListener('click', () => switchSettingsTab('overview'));
        if (tabSettingsRolesMembers) tabSettingsRolesMembers.addEventListener('click', () => switchSettingsTab('roles-members'));
        if (tabSettingsRoles) tabSettingsRoles.addEventListener('click', () => switchSettingsTab('roles'));
        if (tabSettingsMembers) tabSettingsMembers.addEventListener('click', () => switchSettingsTab('members'));

        // Upload e Preview Local de Ícone
        if (btnUploadServerIcon) btnUploadServerIcon.addEventListener('click', () => inputServerIconFile?.click());
        if (inputServerIconFile) {
            inputServerIconFile.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.size > 10 * 1024 * 1024) {
                    alert('O arquivo selecionado é muito grande. Escolha uma imagem de até 10MB.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    pendingServerIconBase64 = dataUrl;
                    renderSettingsAvatarPreview(dataUrl, inputEditServerName?.value || 'NX');
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveServerIcon) {
            btnRemoveServerIcon.addEventListener('click', () => {
                pendingServerIconBase64 = ''; // String vazia sinaliza remoção
                if (inputServerIconFile) inputServerIconFile.value = '';
                renderSettingsAvatarPreview('', inputEditServerName?.value || 'NX');
            });
        }

        // Upload e Preview Local de Banner
        if (btnUploadServerBanner) btnUploadServerBanner.addEventListener('click', () => inputServerBannerFile?.click());
        if (inputServerBannerFile) {
            inputServerBannerFile.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.size > 10 * 1024 * 1024) {
                    alert('O arquivo selecionado é muito grande. Escolha uma imagem de até 10MB.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    pendingServerBannerBase64 = dataUrl;
                    renderSettingsBannerPreview(dataUrl);
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveServerBanner) {
            btnRemoveServerBanner.addEventListener('click', () => {
                pendingServerBannerBase64 = ''; // String vazia sinaliza remoção
                if (inputServerBannerFile) inputServerBannerFile.value = '';
                renderSettingsBannerPreview('');
            });
        }

        // Salvar Alterações na Visão Geral (Nome, Ícone e Banner via Supabase Storage)
        if (formServerOverview) {
            formServerOverview.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newName = inputEditServerName?.value.trim();
                if (!newName || !activeServerId) return;

                try {
                    if (btnSaveServerOverview) {
                        btnSaveServerOverview.disabled = true;
                        btnSaveServerOverview.innerText = 'Processando Upload & Salvando...';
                    }

                    const payload = {
                        nome: newName
                    };

                    if (pendingServerIconBase64 !== null) {
                        payload.icon = pendingServerIconBase64;
                    }

                    if (pendingServerBannerBase64 !== null) {
                        payload.banner = pendingServerBannerBase64;
                    }

                    const res = await fetch(`/servers/${activeServerId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar servidor');

                    if (settingsOverviewAlert) {
                        settingsOverviewAlert.className = 'auth-alert success';
                        settingsOverviewAlert.innerText = 'Servidor e mídias salvos com sucesso no Supabase Storage!';
                        settingsOverviewAlert.style.display = 'block';
                    }

                    const updatedServer = data.server || { ...activeServerObj, nome: newName };
                    activeServerObj = updatedServer;

                    // Atualiza elementos visuais
                    if (selectedServerTitle) selectedServerTitle.innerText = updatedServer.nome;
                    if (settingsServerNameNav) settingsServerNameNav.innerText = updatedServer.nome;
                    if (mainServerHeading) mainServerHeading.innerText = updatedServer.nome;
                    if (welcomeServerTitle) welcomeServerTitle.innerText = `Bem-vindo ao ${updatedServer.nome}!`;

                    applyServerMediaVisuals(updatedServer);
                    await fetchServersList();
                } catch (err) {
                    if (settingsOverviewAlert) {
                        settingsOverviewAlert.className = 'auth-alert error';
                        settingsOverviewAlert.innerText = err.message;
                        settingsOverviewAlert.style.display = 'block';
                    }
                } finally {
                    if (btnSaveServerOverview) {
                        btnSaveServerOverview.disabled = false;
                        btnSaveServerOverview.innerText = 'Salvar Alterações';
                    }
                }
            });
        }

        // ==========================================
        // 2.1 Configurações de Perfil do Usuário (User Profile Modal)
        // ==========================================
        function openUserSettings() {
            if (!currentUser) return;
            if (userSettingsOverlay) {
                if (inputUserDisplayName) inputUserDisplayName.value = currentUser.display_name || currentUser.username || '';
                if (inputUserUsernameDisplay) inputUserUsernameDisplay.value = `@${currentUser.username || ''}`;
                if (sliderMicSensitivity) sliderMicSensitivity.value = userMicGainPreference.toString();
                if (labelMicSensitivity) labelMicSensitivity.textContent = `${Math.round(userMicGainPreference * 100)}%`;
                
                // Sincroniza estado do SoundManager (Sprint de UI/UX)
                if (switchSoundEffects) switchSoundEffects.checked = soundManager.enabled;
                if (sliderSoundVolume) sliderSoundVolume.value = soundManager.volume.toString();
                if (labelSoundVolume) labelSoundVolume.textContent = `${Math.round(soundManager.volume * 100)}%`;

                if (userSettingsAlert) userSettingsAlert.style.display = 'none';
                renderUserSettingsAvatarPreview(currentUser.avatar_url, currentUser.display_name || currentUser.username);
                userSettingsOverlay.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeUserSettings() {
            if (userSettingsOverlay) {
                userSettingsOverlay.classList.remove('open');
                document.body.style.overflow = 'auto';
            }
        }

        function renderUserSettingsAvatarPreview(avatarUrl, name) {
            if (!userSettingsAvatarPreview) return;
            userSettingsAvatarPreview.textContent = '';
            if (avatarUrl) {
                const img = document.createElement('img');
                img.src = avatarUrl;
                img.className = 'user-avatar-img';
                img.alt = name || 'Avatar';
                userSettingsAvatarPreview.appendChild(img);
            } else {
                userSettingsAvatarPreview.textContent = getServerInitials(name || 'NX');
            }
        }

        if (btnOpenUserSettings) btnOpenUserSettings.addEventListener('click', openUserSettings);
        if (btnCloseUserSettings) btnCloseUserSettings.addEventListener('click', closeUserSettings);
        if (btnCancelUserSettings) btnCancelUserSettings.addEventListener('click', closeUserSettings);

        if (sliderMicSensitivity) {
            sliderMicSensitivity.addEventListener('input', (e) => {
                setLocalMicSensitivity(e.target.value);
            });
        }

        // Listeners de Configuração de Efeitos Sonoros
        if (switchSoundEffects) {
            switchSoundEffects.addEventListener('change', (e) => {
                soundManager.setEnabled(e.target.checked);
            });
        }

        if (sliderSoundVolume) {
            sliderSoundVolume.addEventListener('input', (e) => {
                soundManager.setVolume(e.target.value);
                if (labelSoundVolume) labelSoundVolume.textContent = `${Math.round(soundManager.volume * 100)}%`;
            });
        }

        if (btnTestSoundJoin) btnTestSoundJoin.addEventListener('click', () => soundManager.play('join'));
        if (btnTestSoundLeave) btnTestSoundLeave.addEventListener('click', () => soundManager.play('leave'));
        if (btnTestSoundMsg) btnTestSoundMsg.addEventListener('click', () => soundManager.play('message'));
        if (btnTestSoundMute) btnTestSoundMute.addEventListener('click', () => soundManager.play('mute'));

        if (btnUploadUserAvatar) btnUploadUserAvatar.addEventListener('click', () => inputUserAvatarFile?.click());
        if (inputUserAvatarFile) {
            inputUserAvatarFile.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                    alert('O arquivo de avatar é muito grande. Escolha uma imagem de até 10MB.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    pendingUserAvatarBase64 = dataUrl;
                    renderUserSettingsAvatarPreview(dataUrl, inputUserDisplayName?.value || currentUser?.username);
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveUserAvatar) {
            btnRemoveUserAvatar.addEventListener('click', () => {
                pendingUserAvatarBase64 = '';
                if (inputUserAvatarFile) inputUserAvatarFile.value = '';
                renderUserSettingsAvatarPreview('', inputUserDisplayName?.value || currentUser?.username);
            });
        }

        if (formUserSettings) {
            formUserSettings.addEventListener('submit', async (e) => {
                e.preventDefault();
                const displayName = inputUserDisplayName?.value.trim() || '';
                try {
                    if (btnSaveUserSettings) {
                        btnSaveUserSettings.disabled = true;
                        btnSaveUserSettings.innerText = 'Salvando...';
                    }

                    const payload = { display_name: displayName };
                    if (pendingUserAvatarBase64 !== null) {
                        payload.avatar = pendingUserAvatarBase64;
                    }

                    const res = await fetch('/me', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar perfil.');

                    currentUser = data.user || currentUser;
                    updateCurrentUserUI(currentUser);

                    if (userSettingsAlert) {
                        userSettingsAlert.className = 'auth-alert success';
                        userSettingsAlert.innerText = 'Perfil atualizado com sucesso!';
                        userSettingsAlert.style.display = 'block';
                    }
                } catch (err) {
                    if (userSettingsAlert) {
                        userSettingsAlert.className = 'auth-alert error';
                        userSettingsAlert.innerText = err.message;
                        userSettingsAlert.style.display = 'block';
                    }
                } finally {
                    if (btnSaveUserSettings) {
                        btnSaveUserSettings.disabled = false;
                        btnSaveUserSettings.innerText = 'Salvar Alterações';
                    }
                }
            });
        }

        function applyServerMediaVisuals(server) {
            // 1. Aplica Banner no Cabeçalho do Channels Sidebar
            if (channelsSidebarHeader) {
                if (server.banner_url) {
                    channelsSidebarHeader.style.background = `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.95)), url('${server.banner_url}') center/cover no-repeat`;
                } else {
                    channelsSidebarHeader.style.background = 'rgba(255, 255, 255, 0.02)';
                }
            }

            // 2. Aplica Ícone no Avatar de Boas-Vindas
            if (welcomeServerAvatar) {
                welcomeServerAvatar.textContent = '';
                if (server.icon_url) {
                    const img = document.createElement('img');
                    img.src = server.icon_url;
                    img.className = 'server-icon-img';
                    img.alt = server.nome || 'Servidor';
                    welcomeServerAvatar.appendChild(img);
                } else {
                    welcomeServerAvatar.textContent = getServerInitials(server.nome);
                }
            }
        }

        // Carregar Cargos na Aba de Cargos
        async function loadServerRolesInSettings() {
            if (!activeServerId) return;
            try {
                settingsRolesListContainer.textContent = '';
                const loadingDiv = document.createElement('div');
                loadingDiv.style.cssText = 'font-size: 0.85rem; color: #64748b;';
                loadingDiv.textContent = 'Carregando cargos...';
                settingsRolesListContainer.appendChild(loadingDiv);

                const res = await fetch(`/servers/${activeServerId}/roles`);
                const data = await res.json();

                if (data.roles && Array.isArray(data.roles)) {
                    loadedServerRoles = data.roles;
                    renderSettingsRolesList(loadedServerRoles);
                }
            } catch (err) {
                settingsRolesListContainer.textContent = '';
                const errDiv = document.createElement('div');
                errDiv.style.cssText = 'font-size: 0.85rem; color: #fca5a5;';
                errDiv.textContent = 'Erro ao carregar cargos.';
                settingsRolesListContainer.appendChild(errDiv);
            }
        }

        function renderSettingsRolesList(roles) {
            settingsRolesListContainer.textContent = '';
            if (roles.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.style.cssText = 'font-size: 0.85rem; color: #64748b;';
                emptyDiv.textContent = 'Nenhum cargo encontrado.';
                settingsRolesListContainer.appendChild(emptyDiv);
                return;
            }

            roles.forEach(role => {
                const row = document.createElement('div');
                row.className = 'role-row-item';

                const leftDiv = document.createElement('div');
                leftDiv.style.cssText = 'display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; overflow: hidden;';

                const dot = document.createElement('span');
                dot.className = 'role-dot';
                dot.style.background = role.cor_hex || '#94a3b8';
                dot.style.boxShadow = `0 0 8px ${role.cor_hex || '#94a3b8'}`;

                const textDiv = document.createElement('div');
                textDiv.style.cssText = 'display: flex; flex-direction: column; min-width: 0; flex: 1; overflow: hidden;';

                const strong = document.createElement('strong');
                strong.style.cssText = 'color: #fff; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; display: block; min-width: 0;';
                strong.textContent = role.nome;

                const subDiv = document.createElement('div');
                subDiv.style.cssText = 'font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;';
                subDiv.textContent = `Posição: ${role.posicao} • ${role.hoist ? 'Exibido separado' : 'Padrão'}`;

                textDiv.appendChild(strong);
                textDiv.appendChild(subDiv);
                leftDiv.appendChild(dot);
                leftDiv.appendChild(textDiv);

                const chip = document.createElement('span');
                chip.className = 'role-badge-chip';
                chip.style.background = 'rgba(255, 255, 255, 0.08)';
                chip.style.border = `1px solid ${role.cor_hex || 'rgba(255,255,255,0.1)'}`;
                chip.style.whiteSpace = 'nowrap';
                chip.style.overflow = 'hidden';
                chip.style.textOverflow = 'ellipsis';
                chip.style.maxWidth = '160px';
                chip.textContent = role.nome;

                row.appendChild(leftDiv);
                row.appendChild(chip);
                settingsRolesListContainer.appendChild(row);
            });
        }

        // Carregar Membros na Aba de Membros
        async function loadServerMembersInSettings() {
            if (!activeServerId) return;
            try {
                settingsMembersListContainer.textContent = '';
                const loadingDiv = document.createElement('div');
                loadingDiv.style.cssText = 'font-size: 0.85rem; color: #64748b;';
                loadingDiv.textContent = 'Carregando membros...';
                settingsMembersListContainer.appendChild(loadingDiv);

                const res = await fetch(`/servers/${activeServerId}/members`);
                const data = await res.json();

                if (data.members && Array.isArray(data.members)) {
                    loadedServerMembers = data.members;
                    renderSettingsMembersList(loadedServerMembers);
                }
            } catch (err) {
                settingsMembersListContainer.textContent = '';
                const errDiv = document.createElement('div');
                errDiv.style.cssText = 'font-size: 0.85rem; color: #fca5a5;';
                errDiv.textContent = 'Erro ao carregar membros.';
                settingsMembersListContainer.appendChild(errDiv);
            }
        }

        function renderSettingsMembersList(members) {
            settingsMembersListContainer.textContent = '';
            if (members.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.style.cssText = 'font-size: 0.85rem; color: #64748b;';
                emptyDiv.textContent = 'Nenhum membro registrado.';
                settingsMembersListContainer.appendChild(emptyDiv);
                return;
            }

            members.forEach(member => {
                const row = document.createElement('div');
                row.className = 'member-row-item';

                const leftDiv = document.createElement('div');
                leftDiv.style.cssText = 'display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; overflow: hidden;';

                const avatar = document.createElement('div');
                avatar.className = 'user-avatar-circle';
                avatar.style.cssText = 'width: 36px; height: 36px; flex-shrink: 0;';
                avatar.textContent = getServerInitials(member.nickname || member.username);

                const textDiv = document.createElement('div');
                textDiv.style.cssText = 'display: flex; flex-direction: column; min-width: 0; flex: 1; overflow: hidden;';

                const strong = document.createElement('strong');
                strong.style.cssText = 'color: #fff; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; display: block; min-width: 0;';
                strong.textContent = member.nickname || member.username;

                const usernameDiv = document.createElement('div');
                usernameDiv.style.cssText = 'font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; display: block; min-width: 0;';
                usernameDiv.textContent = `@${member.username}`;

                textDiv.appendChild(strong);
                textDiv.appendChild(usernameDiv);
                leftDiv.appendChild(avatar);
                leftDiv.appendChild(textDiv);

                const rolesDiv = document.createElement('div');
                rolesDiv.style.cssText = 'display: flex; gap: 6px; align-items: center; flex-wrap: wrap; flex-shrink: 0;';

                if (Array.isArray(member.roles) && member.roles.length > 0) {
                    member.roles.forEach(r => {
                        const chip = document.createElement('span');
                        chip.className = 'role-badge-chip';
                        chip.style.background = 'rgba(255,255,255,0.06)';
                        chip.style.border = `1px solid ${r.cor_hex || 'rgba(255,255,255,0.1)'}`;
                        chip.style.fontSize = '0.72rem';
                        chip.style.padding = '2px 8px';
                        chip.style.whiteSpace = 'nowrap';
                        chip.style.overflow = 'hidden';
                        chip.style.textOverflow = 'ellipsis';
                        chip.style.maxWidth = '140px';
                        chip.textContent = r.nome;
                        rolesDiv.appendChild(chip);
                    });
                } else {
                    const noRoles = document.createElement('span');
                    noRoles.style.cssText = 'font-size: 0.75rem; color: #64748b;';
                    noRoles.textContent = 'Sem cargos';
                    rolesDiv.appendChild(noRoles);
                }

                row.appendChild(leftDiv);
                row.appendChild(rolesDiv);
                settingsMembersListContainer.appendChild(row);
            });
        }

        // ==========================================
        // Sprint 7: Gestão Integrada de Cargos e Membros (Glassmorphism Toggles)
        // ==========================================
        async function loadServerRolesAndMembersInSettings() {
            if (!activeServerId) return;
            if (!settingsRolesMembersListContainer) return;

            try {
                settingsRolesMembersListContainer.textContent = '';
                const loadingDiv = document.createElement('div');
                loadingDiv.style.cssText = 'font-size: 0.85rem; color: #64748b; padding: 16px; text-align: center;';
                loadingDiv.textContent = 'Carregando lista de participantes e permissões...';
                settingsRolesMembersListContainer.appendChild(loadingDiv);

                const [membersRes, rolesRes] = await Promise.all([
                    fetch(`/servers/${activeServerId}/members`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
                    fetch(`/servers/${activeServerId}/roles`, { headers: { 'Authorization': `Bearer ${authToken}` } })
                ]);

                const membersData = await membersRes.json();
                const rolesData = await rolesRes.json();

                const members = membersData.members || [];
                const roles = rolesData.roles || [];

                renderServerRolesAndMembersList(members, roles);
            } catch (err) {
                console.error('Erro ao carregar cargos e membros:', err);
                settingsRolesMembersListContainer.textContent = '';
                const errDiv = document.createElement('div');
                errDiv.style.cssText = 'font-size: 0.85rem; color: #fca5a5; padding: 16px; text-align: center;';
                errDiv.textContent = 'Erro ao carregar lista de participantes.';
                settingsRolesMembersListContainer.appendChild(errDiv);
            }
        }

        function renderServerRolesAndMembersList(members, roles) {
            if (!settingsRolesMembersListContainer) return;
            settingsRolesMembersListContainer.textContent = '';

            if (members.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.style.cssText = 'font-size: 0.85rem; color: #64748b; padding: 16px; text-align: center;';
                emptyDiv.textContent = 'Nenhum participante registrado.';
                settingsRolesMembersListContainer.appendChild(emptyDiv);
                return;
            }

            const adminRole = roles.find(r => r.nome?.toLowerCase() === 'admin' || r.posicao === 100);
            const modRole = roles.find(r => r.nome?.toLowerCase() === 'moderador' || r.posicao === 50);

            const isOwner = Boolean(activeServerObj && currentUser && Number(activeServerObj.dono_id) === Number(currentUser.id));
            const currentMemberObj = members.find(m => Number(m.user_id) === Number(currentUser?.id));
            const isCurrentMemberAdmin = Boolean(currentMemberObj?.roles?.some(r => r.nome?.toLowerCase() === 'admin' || r.permissoes?.can_manage_roles));
            const canManageRoles = isOwner || isCurrentMemberAdmin;

            members.forEach(member => {
                const card = document.createElement('div');
                card.className = 'member-role-row-card';

                // Esquerda: Avatar + Nome + @username + Badges
                const leftGroup = document.createElement('div');
                leftGroup.className = 'member-info-group';

                const avatarCircle = document.createElement('div');
                avatarCircle.className = 'user-avatar-circle';
                avatarCircle.style.cssText = 'width: 42px; height: 42px; font-size: 0.95rem;';
                if (member.avatar_url) {
                    const img = document.createElement('img');
                    img.src = member.avatar_url;
                    img.className = 'user-avatar-img';
                    img.alt = member.nickname || member.username;
                    avatarCircle.appendChild(img);
                } else {
                    avatarCircle.textContent = getServerInitials(member.nickname || member.username);
                }

                const metaDiv = document.createElement('div');
                metaDiv.className = 'member-meta-text';

                const nameTitle = document.createElement('span');
                nameTitle.className = 'member-display-name';
                nameTitle.textContent = member.nickname || member.username;

                const isMemberOwner = Boolean(activeServerObj && Number(activeServerObj.dono_id) === Number(member.user_id));
                if (isMemberOwner) {
                    const ownerCrown = document.createElement('span');
                    ownerCrown.className = 'role-badge-pill owner';
                    ownerCrown.innerHTML = '👑 Dono';
                    nameTitle.appendChild(ownerCrown);
                }

                const userSub = document.createElement('span');
                userSub.className = 'member-username-sub';
                userSub.textContent = `@${member.username}`;

                const badgesWrap = document.createElement('div');
                badgesWrap.className = 'member-badges-container';

                const memberRoles = member.roles || [];
                const hasAdminRole = memberRoles.some(r => adminRole && (r.id === adminRole.id || r.nome?.toLowerCase() === 'admin'));
                const hasModRole = memberRoles.some(r => modRole && (r.id === modRole.id || r.nome?.toLowerCase() === 'moderador'));

                if (hasAdminRole) {
                    const b = document.createElement('span');
                    b.className = 'role-badge-pill admin';
                    b.textContent = '⚡ Administrador';
                    badgesWrap.appendChild(b);
                }
                if (hasModRole) {
                    const b = document.createElement('span');
                    b.className = 'role-badge-pill moderador';
                    b.textContent = '🛡️ Moderador';
                    badgesWrap.appendChild(b);
                }
                if (!hasAdminRole && !hasModRole && !isMemberOwner) {
                    const b = document.createElement('span');
                    b.className = 'role-badge-pill';
                    b.textContent = 'Membro';
                    badgesWrap.appendChild(b);
                }

                metaDiv.appendChild(nameTitle);
                metaDiv.appendChild(userSub);
                metaDiv.appendChild(badgesWrap);

                leftGroup.appendChild(avatarCircle);
                leftGroup.appendChild(metaDiv);
                card.appendChild(leftGroup);

                // Direita: Glassmorphism Toggles
                const togglesWrap = document.createElement('div');
                togglesWrap.className = 'member-toggles-container';

                // Toggle Administrador
                if (adminRole) {
                    const adminToggleWrap = document.createElement('div');
                    adminToggleWrap.className = 'glass-toggle-wrapper';

                    const adminLabel = document.createElement('span');
                    adminLabel.className = 'glass-toggle-label';
                    adminLabel.textContent = 'Admin';

                    const switchLabel = document.createElement('label');
                    switchLabel.className = 'glass-switch admin';

                    const chkAdmin = document.createElement('input');
                    chkAdmin.type = 'checkbox';
                    chkAdmin.checked = hasAdminRole || isMemberOwner;
                    chkAdmin.disabled = !canManageRoles || isMemberOwner || Number(member.user_id) === Number(currentUser?.id);

                    const slider = document.createElement('span');
                    slider.className = 'glass-slider';

                    chkAdmin.addEventListener('change', async () => {
                        await toggleMemberRole(member.user_id, adminRole.id, chkAdmin.checked, 'Administrador');
                    });

                    switchLabel.appendChild(chkAdmin);
                    switchLabel.appendChild(slider);
                    adminToggleWrap.appendChild(adminLabel);
                    adminToggleWrap.appendChild(switchLabel);
                    togglesWrap.appendChild(adminToggleWrap);
                }

                // Toggle Moderador
                if (modRole) {
                    const modToggleWrap = document.createElement('div');
                    modToggleWrap.className = 'glass-toggle-wrapper';

                    const modLabel = document.createElement('span');
                    modLabel.className = 'glass-toggle-label';
                    modLabel.textContent = 'Moderador';

                    const switchLabel = document.createElement('label');
                    switchLabel.className = 'glass-switch mod';

                    const chkMod = document.createElement('input');
                    chkMod.type = 'checkbox';
                    chkMod.checked = hasModRole;
                    chkMod.disabled = !canManageRoles || isMemberOwner;

                    const slider = document.createElement('span');
                    slider.className = 'glass-slider';

                    chkMod.addEventListener('change', async () => {
                        await toggleMemberRole(member.user_id, modRole.id, chkMod.checked, 'Moderador');
                    });

                    switchLabel.appendChild(chkMod);
                    switchLabel.appendChild(slider);
                    modToggleWrap.appendChild(modLabel);
                    modToggleWrap.appendChild(switchLabel);
                    togglesWrap.appendChild(modToggleWrap);
                }

                card.appendChild(togglesWrap);
                settingsRolesMembersListContainer.appendChild(card);
            });
        }

        async function toggleMemberRole(targetUserId, roleId, isAssign, roleName) {
            if (!activeServerId || !targetUserId || !roleId) return;
            try {
                const method = isAssign ? 'POST' : 'DELETE';
                const res = await fetch(`/servers/${activeServerId}/members/${targetUserId}/roles/${roleId}`, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || 'Erro ao alterar cargo do membro.');
                    loadServerRolesAndMembersInSettings();
                    return;
                }
                console.log(`✅ Cargo ${roleName} ${isAssign ? 'atribuído a' : 'removido de'} [${targetUserId}]`);
                loadServerRolesAndMembersInSettings();
            } catch (err) {
                console.error('Erro na requisição de cargo:', err);
                alert('Erro ao comunicar com o servidor.');
                loadServerRolesAndMembersInSettings();
            }
        }

        // ==========================================
        // 3. Portão de Autenticação & Gestão de Sessão (Auth Gate)
        // ==========================================
        function showAuthGateAlert(msg, type = 'error') {
            authGateAlert.className = `auth-alert ${type}`;
            authGateAlert.innerText = msg;
            authGateAlert.style.display = 'block';
        }

        function hideAuthGateAlert() {
            authGateAlert.style.display = 'none';
        }

        function showAuthGate(alertMsg = '', alertType = 'error') {
            authGateContainer.classList.remove('hidden');
            appRoot.classList.add('hidden');
            if (alertMsg) {
                showAuthGateAlert(alertMsg, alertType);
            } else {
                hideAuthGateAlert();
            }
        }

        function enterApp(user) {
            // 1. Oculta o Portão e Revela o Layout Principal via classes CSS
            try {
                if (authGateContainer) authGateContainer.classList.add('hidden');
                if (appRoot) appRoot.classList.remove('hidden');

                // Garante exclusividade mútua estrita na inicialização: exibe serverPanel e oculta homePanel
                openServerPanel();
            } catch (domErr) {
                console.error('Erro na transição visual do layout #appRoot:', domErr);
            }

            // 2. Atualiza estado e interface do usuário
            try {
                currentUser = user || currentUser || { username: localStorage.getItem('nexuscomm_username') || 'Usuário' };
                updateCurrentUserUI(currentUser);
            } catch (uiErr) {
                console.warn('Aviso ao atualizar UI do usuário:', uiErr);
            }

            // 3. Conexão Segura do Socket.IO após persistência e transição
            try {
                const effectiveUsername = user?.username || currentUser?.username || localStorage.getItem('nexuscomm_username') || '';
                socket.auth = { token: authToken, username: effectiveUsername };
                if (socket.connected) {
                    socket.disconnect();
                }
                socket.connect();
            } catch (sockErr) {
                console.warn('Aviso ao conectar Socket.IO:', sockErr);
            }

            // 4. Busca lista isolada de servidores
            try {
                fetchServersList();
            } catch (srvErr) {
                console.warn('Aviso ao buscar lista de servidores:', srvErr);
            }

            // 5. 🔔 Solicita permissão de Notificações do Navegador (Sprint 7)
            try {
                requestBrowserNotificationPermission();
            } catch (notifErr) {
                console.warn('Aviso ao solicitar permissão de notificações:', notifErr);
            }

            // 6. 🔗 Verifica se há convite pendente na URL (Sprint de Convites)
            try {
                checkUrlInviteParam();
            } catch (inviteErr) {
                console.warn('Aviso ao verificar convite na URL:', inviteErr);
            }
        }

        function logoutApp(message = '') {
            localStorage.removeItem('nexuscomm_jwt_token');
            localStorage.removeItem('nexuscomm_username');
            authToken = '';
            currentUser = null;
            if (activeChannelId) leaveRoom();
            if (socket.connected) socket.disconnect();
            showAuthGate(message);
        }

        // Alternância de Abas do Auth Gate
        if (tabGateLogin) {
            tabGateLogin.addEventListener('click', () => {
                tabGateLogin.classList.add('active');
                if (tabGateRegister) tabGateRegister.classList.remove('active');
                if (tabGateToken) tabGateToken.classList.remove('active');
                if (formGateLogin) formGateLogin.style.display = 'flex';
                if (formGateRegister) formGateRegister.style.display = 'none';
                if (formGateToken) formGateToken.style.display = 'none';
                hideAuthGateAlert();
            });
        }

        if (tabGateRegister) {
            tabGateRegister.addEventListener('click', () => {
                tabGateRegister.classList.add('active');
                if (tabGateLogin) tabGateLogin.classList.remove('active');
                if (tabGateToken) tabGateToken.classList.remove('active');
                if (formGateRegister) formGateRegister.style.display = 'flex';
                if (formGateLogin) formGateLogin.style.display = 'none';
                if (formGateToken) formGateToken.style.display = 'none';
                hideAuthGateAlert();
            });
        }

        if (tabGateToken) {
            tabGateToken.addEventListener('click', () => {
                tabGateToken.classList.add('active');
                if (tabGateLogin) tabGateLogin.classList.remove('active');
                if (tabGateRegister) tabGateRegister.classList.remove('active');
                if (formGateToken) formGateToken.style.display = 'flex';
                if (formGateLogin) formGateLogin.style.display = 'none';
                if (formGateRegister) formGateRegister.style.display = 'none';
                hideAuthGateAlert();
            });
        }

        // Submissão do Login
        if (formGateLogin) {
            formGateLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = gateLoginUsername?.value.trim();
                const password = gateLoginPassword?.value.trim();
                if (!username || !password) {
                    showAuthGateAlert('Preencha o usuário e a senha.', 'error');
                    return;
                }
                try {
                    if (btnSubmitGateLogin) {
                        btnSubmitGateLogin.disabled = true;
                        btnSubmitGateLogin.innerText = 'Entrando...';
                    }
                    const res = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao realizar login');

                    authToken = data.token;
                    localStorage.setItem('nexuscomm_jwt_token', authToken);
                    localStorage.setItem('nexuscomm_username', data.user.username);

                    enterApp(data.user);
                } catch (err) {
                    showAuthGateAlert(err.message, 'error');
                } finally {
                    if (btnSubmitGateLogin) {
                        btnSubmitGateLogin.disabled = false;
                        btnSubmitGateLogin.innerText = 'Entrar no NexusComm';
                    }
                }
            });
        }

        // Submissão do Cadastro
        if (formGateRegister) {
            formGateRegister.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = gateRegisterUsername?.value.trim();
                const password = gateRegisterPassword?.value.trim();
                if (!username || !password) {
                    showAuthGateAlert('Preencha todos os campos para cadastrar.', 'error');
                    return;
                }
                try {
                    if (btnSubmitGateRegister) {
                        btnSubmitGateRegister.disabled = true;
                        btnSubmitGateRegister.innerText = 'Cadastrando...';
                    }
                    const res = await fetch('/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao registrar usuário');

                    showAuthGateAlert('Cadastro realizado com sucesso! Conectando...', 'success');

                    // Realiza login imediato
                    const loginRes = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const loginData = await loginRes.json();
                    if (!loginRes.ok) throw new Error(loginData.error || 'Erro ao autenticar após registro');

                    authToken = loginData.token;
                    localStorage.setItem('nexuscomm_jwt_token', authToken);
                    localStorage.setItem('nexuscomm_username', loginData.user.username);

                    enterApp(loginData.user);
                } catch (err) {
                    showAuthGateAlert(err.message, 'error');
                } finally {
                    if (btnSubmitGateRegister) {
                        btnSubmitGateRegister.disabled = false;
                        btnSubmitGateRegister.innerText = 'Criar Conta & Entrar';
                    }
                }
            });
        }

        // Submissão de Token Direto
        if (formGateToken) {
            formGateToken.addEventListener('submit', async (e) => {
                e.preventDefault();
                const token = gateTokenInput?.value.trim();
                if (!token) {
                    showAuthGateAlert('Informe um token JWT válido.', 'error');
                    return;
                }
                try {
                    if (btnSubmitGateToken) {
                        btnSubmitGateToken.disabled = true;
                        btnSubmitGateToken.innerText = 'Validando...';
                    }
                    const res = await fetch('/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Token inválido ou expirado.');

                    authToken = token;
                    localStorage.setItem('nexuscomm_jwt_token', token);
                    localStorage.setItem('nexuscomm_username', data.user.username);

                    enterApp(data.user);
                } catch (err) {
                    showAuthGateAlert(err.message, 'error');
                } finally {
                    if (btnSubmitGateToken) {
                        btnSubmitGateToken.disabled = false;
                        btnSubmitGateToken.innerText = 'Validar & Conectar';
                    }
                }
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                logoutApp('Você saiu com sucesso.');
            });
        }

        // ==========================================
        // 4. Menu de Servidores e Isolamento de Visão
        // ==========================================

        async function fetchServersList() {
            if (!authToken) return;
            try {
                const res = await fetch('/servers', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.status === 401 || res.status === 403) {
                    logoutApp('Sua sessão expirou. Faça login novamente.');
                    return;
                }
                const data = await res.json();
                if (data && Array.isArray(data.servers)) {
                    loadedServers = data.servers;
                    renderServersList(loadedServers);
                    if (loadedServers.length > 0) {
                        const targetServer = activeServerId ? (loadedServers.find(s => s.id === activeServerId) || loadedServers[0]) : loadedServers[0];
                        selectServer(targetServer);
                    } else {
                        openHomePanel();
                    }
                }
            } catch (err) {
                console.warn('Aviso ao carregar servidores:', err);
            }
        }

        function renderServersList(servers) {
            if (!serversList) return;
            serversList.textContent = '';

            if (!servers || servers.length === 0) {
                return;
            }

            servers.forEach((server) => {
                const wrapper = document.createElement('div');
                wrapper.className = `server-icon-wrapper ${activeServerId === server.id ? 'active' : ''}`;
                wrapper.setAttribute('data-tooltip', server.nome || '');
                wrapper.id = `server-item-${server.id}`;

                const pill = document.createElement('span');
                pill.className = 'server-pill';

                const iconDiv = document.createElement('div');
                iconDiv.className = 'server-icon';

                if (server.icon_url) {
                    const img = document.createElement('img');
                    img.src = server.icon_url;
                    img.className = 'server-icon-img';
                    img.alt = server.nome || 'Servidor';
                    iconDiv.appendChild(img);
                } else {
                    iconDiv.textContent = getServerInitials(server.nome);
                }

                wrapper.appendChild(pill);
                wrapper.appendChild(iconDiv);

                wrapper.addEventListener('click', () => {
                    selectServer(server);
                });

                serversList.appendChild(wrapper);
            });
        }

        // ==========================================
        // Hub Social: Navegação & Amigos (Sprint 3)
        // ==========================================
        function openHomePanel() {
            activeServerId = null;
            activeServerObj = null;

            // Exclusividade Mútua Estrita: Oculta Servidores, Revela Home
            if (serverPanel) serverPanel.classList.add('hidden');
            if (homePanel) homePanel.classList.remove('hidden');

            document.querySelectorAll('.server-icon-wrapper').forEach(el => el.classList.remove('active'));
            if (btnServerHome) btnServerHome.classList.add('active');

            fetchFriendsList();
        }

        function openServerPanel() {
            // Exclusividade Mútua Estrita: Oculta Home, Revela Servidores
            if (homePanel) homePanel.classList.add('hidden');
            if (serverPanel) serverPanel.classList.remove('hidden');
            if (btnServerHome) btnServerHome.classList.remove('active');
        }

        function switchSocialTab(tab) {
            currentSocialTab = tab;
            [tabFriendsOnline, tabFriendsAll, tabFriendsPending, tabFriendsAdd].forEach(btn => {
                if (btn) btn.classList.remove('active');
            });

            if (tab === 'online') {
                if (tabFriendsOnline) tabFriendsOnline.classList.add('active');
                if (viewFriendsList) viewFriendsList.classList.remove('hidden');
                if (viewFriendsAdd) viewFriendsAdd.classList.add('hidden');
            } else if (tab === 'all') {
                if (tabFriendsAll) tabFriendsAll.classList.add('active');
                if (viewFriendsList) viewFriendsList.classList.remove('hidden');
                if (viewFriendsAdd) viewFriendsAdd.classList.add('hidden');
            } else if (tab === 'pending') {
                if (tabFriendsPending) tabFriendsPending.classList.add('active');
                if (viewFriendsList) viewFriendsList.classList.remove('hidden');
                if (viewFriendsAdd) viewFriendsAdd.classList.add('hidden');
            } else if (tab === 'add') {
                if (tabFriendsAdd) tabFriendsAdd.classList.add('active');
                if (viewFriendsList) viewFriendsList.classList.add('hidden');
                if (viewFriendsAdd) viewFriendsAdd.classList.remove('hidden');
                if (inputAddFriendUsername) inputAddFriendUsername.focus();
            }

            renderFriendsList();
        }

        async function fetchFriendsList() {
            if (!authToken) return;
            try {
                const res = await fetch('/friends', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.ok) {
                    cachedFriendships = await res.json();
                    updateFriendsBadges();
                    renderFriendsList();
                    renderDirectMessagesList();
                }
            } catch (err) {
                console.warn('Aviso ao carregar amigos:', err);
            }
        }

        function updateFriendsBadges() {
            const accepted = cachedFriendships.accepted || [];
            const onlineCount = accepted.filter(f => onlineUserIdsSet.has(f.id)).length;
            const allCount = accepted.length;
            const incoming = cachedFriendships.pending_incoming || [];
            const outgoing = cachedFriendships.pending_outgoing || [];
            const totalPending = incoming.length + outgoing.length;

            if (countFriendsOnline) countFriendsOnline.textContent = String(onlineCount);
            if (countFriendsAll) countFriendsAll.textContent = String(allCount);
            if (countFriendsPending) {
                countFriendsPending.textContent = String(totalPending);
                if (totalPending > 0) {
                    countFriendsPending.classList.remove('hidden');
                } else {
                    countFriendsPending.classList.add('hidden');
                }
            }
            if (badgePendingDmsSidebar) {
                const incomingCount = incoming.length;
                badgePendingDmsSidebar.textContent = String(incomingCount);
                if (incomingCount > 0) {
                    badgePendingDmsSidebar.classList.remove('hidden');
                } else {
                    badgePendingDmsSidebar.classList.add('hidden');
                }
            }
        }

        function renderFriendsList() {
            if (!friendsListContainer) return;
            friendsListContainer.textContent = '';

            const searchTerm = (inputSearchFriends?.value || '').trim().toLowerCase();

            let targetList = [];
            let sectionTitleText = '';

            if (currentSocialTab === 'online') {
                targetList = (cachedFriendships.accepted || []).filter(f => {
                    const isOnline = onlineUserIdsSet.has(f.id);
                    const matchesSearch = !searchTerm || (f.username && f.username.toLowerCase().includes(searchTerm)) || (f.display_name && f.display_name.toLowerCase().includes(searchTerm));
                    return isOnline && matchesSearch;
                });
                sectionTitleText = `ONLINE — ${targetList.length}`;
            } else if (currentSocialTab === 'all') {
                targetList = (cachedFriendships.accepted || []).filter(f => {
                    return !searchTerm || (f.username && f.username.toLowerCase().includes(searchTerm)) || (f.display_name && f.display_name.toLowerCase().includes(searchTerm));
                });
                sectionTitleText = `TODOS OS AMIGOS — ${targetList.length}`;
            } else if (currentSocialTab === 'pending') {
                const incoming = (cachedFriendships.pending_incoming || []).map(f => ({ ...f, _type: 'incoming' }));
                const outgoing = (cachedFriendships.pending_outgoing || []).map(f => ({ ...f, _type: 'outgoing' }));
                targetList = [...incoming, ...outgoing].filter(f => {
                    return !searchTerm || (f.username && f.username.toLowerCase().includes(searchTerm)) || (f.display_name && f.display_name.toLowerCase().includes(searchTerm));
                });
                sectionTitleText = `PENDENTES — ${targetList.length}`;
            }

            if (friendsListSectionTitle) {
                friendsListSectionTitle.textContent = sectionTitleText;
            }

            if (targetList.length === 0) {
                const emptyCard = document.createElement('div');
                emptyCard.style.cssText = 'padding: 40px 20px; text-align: center; color: var(--text-dark-muted); font-size: 0.9rem;';
                
                let emptyMsg = 'Nenhum amigo online no momento.';
                if (currentSocialTab === 'all') emptyMsg = 'Você ainda não tem amigos adicionados.';
                if (currentSocialTab === 'pending') emptyMsg = 'Nenhuma solicitação de amizade pendente.';
                if (searchTerm) emptyMsg = 'Nenhum amigo encontrado com essa busca.';

                emptyCard.textContent = emptyMsg;
                friendsListContainer.appendChild(emptyCard);
                return;
            }

            targetList.forEach(friend => {
                const card = document.createElement('div');
                card.className = 'friend-row-card';

                // Lado Esquerdo: Avatar + Nomes
                const leftDiv = document.createElement('div');
                leftDiv.className = 'friend-card-left';

                const avatarWrap = document.createElement('div');
                avatarWrap.className = 'friend-avatar-wrap';

                const avatarCircle = document.createElement('div');
                avatarCircle.className = 'user-avatar-circle';
                const friendDisplayName = friend.display_name || friend.username || 'Amigo';
                if (friend.avatar_url) {
                    const img = document.createElement('img');
                    img.src = friend.avatar_url;
                    img.className = 'user-avatar-img';
                    img.alt = friendDisplayName;
                    avatarCircle.appendChild(img);
                } else {
                    avatarCircle.textContent = getServerInitials(friendDisplayName);
                }

                const statusDot = document.createElement('span');
                const isOnline = onlineUserIdsSet.has(friend.id);
                statusDot.className = `friend-status-dot ${isOnline ? 'status-online' : 'status-offline'}`;

                avatarWrap.appendChild(avatarCircle);
                avatarWrap.appendChild(statusDot);

                const metaDiv = document.createElement('div');
                metaDiv.className = 'friend-card-meta';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'friend-card-name';
                nameDiv.textContent = friendDisplayName;

                const tagSpan = document.createElement('span');
                tagSpan.className = 'friend-card-tag';
                tagSpan.textContent = `@${friend.username || 'usuario'}`;
                nameDiv.appendChild(tagSpan);

                const subDiv = document.createElement('div');
                subDiv.className = 'friend-card-sub';
                if (friend._type === 'incoming') {
                    subDiv.textContent = 'Pedido de amizade recebido';
                } else if (friend._type === 'outgoing') {
                    subDiv.textContent = 'Pedido de amizade enviado';
                } else {
                    subDiv.textContent = isOnline ? 'Online' : 'Offline';
                }

                metaDiv.appendChild(nameDiv);
                metaDiv.appendChild(subDiv);

                leftDiv.appendChild(avatarWrap);
                leftDiv.appendChild(metaDiv);

                // Lado Direito: Ações
                const actionsGroup = document.createElement('div');
                actionsGroup.className = 'friend-actions-group';

                if (friend._type === 'incoming') {
                    // Botão Aceitar (Verde)
                    const btnAccept = document.createElement('button');
                    btnAccept.type = 'button';
                    btnAccept.className = 'btn-friend-action btn-accept';
                    btnAccept.title = 'Aceitar Pedido de Amizade';
                    btnAccept.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
                    btnAccept.addEventListener('click', () => {
                        respondFriendRequestAction(friend.friendship_id, 'accept');
                    });

                    // Botão Recusar (Vermelho)
                    const btnDecline = document.createElement('button');
                    btnDecline.type = 'button';
                    btnDecline.className = 'btn-friend-action btn-decline';
                    btnDecline.title = 'Recusar Pedido';
                    btnDecline.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>';
                    btnDecline.addEventListener('click', () => {
                        respondFriendRequestAction(friend.friendship_id, 'decline');
                    });

                    actionsGroup.appendChild(btnAccept);
                    actionsGroup.appendChild(btnDecline);
                } else if (friend._type === 'outgoing') {
                    // Botão Cancelar Pedido
                    const btnCancel = document.createElement('button');
                    btnCancel.type = 'button';
                    btnCancel.className = 'btn-friend-action btn-decline';
                    btnCancel.title = 'Cancelar Pedido Enviado';
                    btnCancel.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>';
                    btnCancel.addEventListener('click', () => {
                        respondFriendRequestAction(friend.friendship_id, 'decline');
                    });
                    actionsGroup.appendChild(btnCancel);
                } else {
                    // Amigo Aceito: Botão Iniciar Conversa / Mensagem Direta
                    const btnMsg = document.createElement('button');
                    btnMsg.type = 'button';
                    btnMsg.className = 'btn-friend-action';
                    btnMsg.title = 'Mensagem Direta';
                    btnMsg.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';
                    btnMsg.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openDirectMessageChat(friend);
                    });
                    actionsGroup.appendChild(btnMsg);

                    // Clicar no card inteiro também abre a DM diretamente
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        openDirectMessageChat(friend);
                    });
                }

                card.appendChild(leftDiv);
                card.appendChild(actionsGroup);
                friendsListContainer.appendChild(card);
            });
        }

        function renderDirectMessagesList() {
            if (!homeDmsList) return;
            homeDmsList.textContent = '';

            const friends = cachedFriendships.accepted || [];
            if (friends.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.style.cssText = 'padding: 12px 10px; font-size: 0.8rem; color: var(--text-dark-muted); text-align: center;';
                emptyMsg.textContent = 'Nenhuma conversa recente.';
                homeDmsList.appendChild(emptyMsg);
                return;
            }

            friends.forEach(friend => {
                const item = document.createElement('div');
                item.className = `channel-item ${activeDmUserId === friend.id ? 'active' : ''}`;
                item.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; cursor: pointer;';

                const avatar = document.createElement('div');
                avatar.className = 'user-avatar-circle';
                avatar.style.cssText = 'width: 28px; height: 28px; font-size: 0.75rem; flex-shrink: 0;';
                const name = friend.display_name || friend.username || 'Amigo';
                if (friend.avatar_url) {
                    const img = document.createElement('img');
                    img.src = friend.avatar_url;
                    img.className = 'user-avatar-img';
                    img.alt = name;
                    avatar.appendChild(img);
                } else {
                    avatar.textContent = getServerInitials(name);
                }

                const nameSpan = document.createElement('span');
                nameSpan.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem;';
                nameSpan.textContent = name;

                const isOnline = onlineUserIdsSet.has(friend.id);
                const dot = document.createElement('span');
                dot.style.cssText = `width: 6px; height: 6px; border-radius: 50%; background: ${isOnline ? '#10b981' : '#64748b'}; flex-shrink: 0;`;

                item.appendChild(avatar);
                item.appendChild(nameSpan);
                item.appendChild(dot);

                item.addEventListener('click', () => {
                    openDirectMessageChat(friend);
                });

                homeDmsList.appendChild(item);
            });
        }

        // ==========================================
        // 4.1 Interface de Chat Pessoal (DM) & Histórico (Sprint 3 - Parte 2)
        // ==========================================
        async function openDirectMessageChat(friend) {
            if (!friend) return;
            activeDmUserId = friend.id;
            activeDmFriendObj = friend;

            // Oculta Topbar e Palco de Amigos, Revela Chat de DM
            if (homeStageTopbar) homeStageTopbar.classList.add('hidden');
            if (homeStageContent) homeStageContent.classList.add('hidden');
            if (viewDirectMessageChat) viewDirectMessageChat.classList.remove('hidden');

            // Atualiza Topbar do Chat DM
            const displayName = friend.display_name || friend.username || 'Amigo';
            if (dmFriendName) dmFriendName.textContent = displayName;
            if (dmFriendTag) dmFriendTag.textContent = `@${friend.username || 'usuario'}`;

            const isOnline = onlineUserIdsSet.has(friend.id);
            if (dmFriendStatusDot) {
                dmFriendStatusDot.className = `friend-status-dot ${isOnline ? 'status-online' : 'status-offline'}`;
            }
            if (dmFriendPresenceText) {
                dmFriendPresenceText.textContent = isOnline ? 'Disponível / Online' : 'Offline';
            }

            if (dmFriendAvatar) {
                dmFriendAvatar.textContent = '';
                if (friend.avatar_url) {
                    const img = document.createElement('img');
                    img.src = friend.avatar_url;
                    img.className = 'user-avatar-img';
                    img.alt = displayName;
                    dmFriendAvatar.appendChild(img);
                } else {
                    dmFriendAvatar.textContent = getServerInitials(displayName);
                }
            }

            // Atualiza Banner de Boas-Vindas da DM
            if (dmWelcomeTitle) dmWelcomeTitle.textContent = `Início da conversa com ${displayName}`;
            if (dmWelcomeDesc) dmWelcomeDesc.textContent = `Este é o começo do seu histórico de mensagens diretas e privadas com @${friend.username || 'usuario'}.`;
            if (dmWelcomeAvatar) {
                dmWelcomeAvatar.textContent = '';
                if (friend.avatar_url) {
                    const img = document.createElement('img');
                    img.src = friend.avatar_url;
                    img.className = 'user-avatar-img';
                    img.alt = displayName;
                    dmWelcomeAvatar.appendChild(img);
                } else {
                    dmWelcomeAvatar.textContent = getServerInitials(displayName);
                }
            }

            if (inputDmMessage) {
                inputDmMessage.placeholder = `Conversar com @${friend.username || 'amigo'}...`;
                inputDmMessage.focus();
            }

            renderDirectMessagesList();
            await fetchDirectMessagesHistory(friend.id);
        }

        function closeDirectMessageChat() {
            activeDmUserId = null;
            activeDmFriendObj = null;

            if (viewDirectMessageChat) viewDirectMessageChat.classList.add('hidden');
            if (homeStageTopbar) homeStageTopbar.classList.remove('hidden');
            if (homeStageContent) homeStageContent.classList.remove('hidden');

            renderDirectMessagesList();
            switchSocialTab(currentSocialTab || 'online');
        }

        async function fetchDirectMessagesHistory(friendId) {
            if (!friendId || !authToken) return;
            if (!dmMessagesList) return;

            dmMessagesList.textContent = '';
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'padding: 20px; text-align: center; color: var(--text-dark-muted); font-size: 0.85rem;';
            loadingMsg.textContent = 'Carregando histórico de mensagens diretas...';
            dmMessagesList.appendChild(loadingMsg);

            try {
                const res = await fetch(`/dms/${friendId}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await res.json();
                dmMessagesList.textContent = '';

                if (data && Array.isArray(data.messages)) {
                    data.messages.forEach(msg => {
                        renderDmMessageItem(msg, false);
                    });
                }
                scrollDmChatToBottom();
            } catch (err) {
                console.error('Erro ao carregar mensagens diretas:', err);
                if (dmMessagesList) {
                    dmMessagesList.textContent = '';
                    const errorMsg = document.createElement('div');
                    errorMsg.style.cssText = 'padding: 20px; text-align: center; color: #f87171; font-size: 0.85rem;';
                    errorMsg.textContent = 'Erro ao carregar mensagens diretas.';
                    dmMessagesList.appendChild(errorMsg);
                }
            }
        }

        function renderDmMessageItem(msg, shouldScroll = true) {
            if (!dmMessagesList || !msg) return;

            const bubble = document.createElement('div');
            bubble.className = 'dm-message-bubble';

            // Avatar
            const avatar = document.createElement('div');
            avatar.className = 'dm-message-avatar';
            const authorName = msg.sender_display_name || msg.sender_username || (msg.sender_id === currentUser?.id ? (currentUser?.display_name || currentUser?.username) : (activeDmFriendObj?.display_name || activeDmFriendObj?.username)) || 'Usuário';

            const avatarUrl = msg.sender_avatar_url || (msg.sender_id === currentUser?.id ? currentUser?.avatar_url : activeDmFriendObj?.avatar_url);
            if (avatarUrl) {
                const img = document.createElement('img');
                img.src = avatarUrl;
                img.className = 'user-avatar-img';
                img.alt = authorName;
                avatar.appendChild(img);
            } else {
                avatar.textContent = getServerInitials(authorName);
            }

            // Conteúdo
            const wrap = document.createElement('div');
            wrap.className = 'dm-message-content-wrap';

            const header = document.createElement('div');
            header.className = 'dm-message-header';

            const authorSpan = document.createElement('span');
            authorSpan.className = 'dm-message-author';
            authorSpan.textContent = authorName;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'dm-message-timestamp';
            const dateObj = msg.timestamp || msg.created_at ? new Date(msg.timestamp || msg.created_at) : new Date();
            timeSpan.textContent = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            header.appendChild(authorSpan);
            header.appendChild(timeSpan);
            wrap.appendChild(header);

            // Texto da Mensagem
            const textContent = msg.text || msg.content || '';
            if (textContent) {
                const textDiv = document.createElement('div');
                textDiv.className = 'dm-message-text';
                textDiv.innerHTML = formatMessageTextWithMentions(textContent);
                wrap.appendChild(textDiv);
            }

            // Anexo de Imagem na DM (Sprint 4)
            if (msg.media_url) {
                const imgWrap = document.createElement('div');
                imgWrap.className = 'chat-message-image-wrapper';
                const mediaImg = document.createElement('img');
                mediaImg.className = 'chat-message-image';
                mediaImg.src = msg.media_url;
                mediaImg.alt = 'Imagem anexada';
                mediaImg.loading = 'lazy';
                mediaImg.title = 'Clique para ver em tamanho real';
                mediaImg.addEventListener('click', () => {
                    window.open(msg.media_url, '_blank');
                });
                imgWrap.appendChild(mediaImg);
                wrap.appendChild(imgWrap);
            }

            bubble.appendChild(avatar);
            bubble.appendChild(wrap);

            dmMessagesList.appendChild(bubble);

            if (shouldScroll) {
                scrollDmChatToBottom();
            }
        }

        function scrollDmChatToBottom() {
            if (dmChatMessagesContainer) {
                dmChatMessagesContainer.scrollTop = dmChatMessagesContainer.scrollHeight;
            }
        }

        async function sendDmAction(content) {
            const safeContent = (content || '').trim();
            const hasMedia = Boolean(pendingDmMedia);
            if (!safeContent && !hasMedia) return;
            if (!activeDmUserId) return;

            stopInputTyping(getActiveDmRoomName(), 'dm');

            let uploadedMediaUrl = null;
            if (hasMedia) {
                try {
                    uploadedMediaUrl = await uploadChatMedia(pendingDmMedia.file, pendingDmMedia.base64);
                } catch (upErr) {
                    console.error('Erro no upload de mídia DM:', upErr);
                    alert('Erro ao enviar imagem: ' + (upErr.message || 'Falha no upload'));
                    return;
                }
                clearDmMediaPreview();
            }

            const dmPayload = {
                receiverId: activeDmUserId,
                content: safeContent,
                media_url: uploadedMediaUrl
            };

            if (socket.connected) {
                socket.emit('send-dm', dmPayload);
            } else {
                try {
                    const res = await fetch(`/dms/${activeDmUserId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(dmPayload)
                    });
                    const data = await res.json();
                    if (data?.message) {
                        renderDmMessageItem(data.message, true);
                    }
                } catch (err) {
                    console.error('Erro no envio HTTP da DM:', err);
                }
            }

            if (inputDmMessage) {
                inputDmMessage.value = '';
            }
        }

        // ==========================================
        // Sprint 7: Notificações Nativas do Navegador (Web Notifications API)
        // ==========================================
        function requestBrowserNotificationPermission() {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    console.log(`🔔 [Web Notifications] Permissão de notificação: ${permission}`);
                }).catch(err => {
                    console.warn('Aviso ao solicitar permissão de notificação:', err);
                });
            }
        }

        function triggerDmPushNotification({ senderName, text, avatarUrl, senderId }) {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') return;
            // Só dispara notificação nativa se a aba estiver oculta / em segundo plano
            if (document.visibilityState !== 'hidden') return;

            try {
                const snippet = text ? (text.length > 80 ? text.substring(0, 80) + '...' : text) : 'Enviou uma imagem anexada.';
                const notif = new Notification(`NexusComm • Mensagem de ${senderName}`, {
                    body: snippet,
                    icon: avatarUrl || '/favicon.ico',
                    tag: `dm-${senderId}`
                });

                notif.onclick = () => {
                    window.focus();
                    if (cachedFriendships?.accepted) {
                        const friend = cachedFriendships.accepted.find(f => Number(f.id) === Number(senderId));
                        if (friend) {
                            openHomePanel();
                            openDirectMessageChat(friend);
                        }
                    }
                    notif.close();
                };
            } catch (notifErr) {
                console.warn('Aviso ao disparar notificação do navegador:', notifErr);
            }
        }

        function handleIncomingDm(msg) {
            if (!msg) return;
            console.log('💬 Nova DM recebida:', msg);

            if (activeDmUserId && (msg.sender_id === activeDmUserId || msg.receiver_id === activeDmUserId)) {
                renderDmMessageItem(msg, true);
            }

            // 🔔 Notificação e Som de Mensagem para mensagens recebidas de outro usuário
            if (currentUser && Number(msg.sender_id) !== Number(currentUser.id)) {
                soundManager.play('message');
                const senderName = msg.sender_display_name || msg.sender_username || 'Amigo';
                triggerDmPushNotification({
                    senderName: senderName,
                    text: msg.text || msg.content,
                    avatarUrl: msg.sender_avatar_url,
                    senderId: msg.sender_id
                });
            }

            renderDirectMessagesList();
        }

        // ==========================================
        // 4.2 Isolamento WebRTC: Chamadas P2P Privadas (Sprint 3 - Parte 2)
        // ==========================================
        async function startPrivateCall(friend, isVideo) {
            if (!friend || !currentUser) return;
            const myId = Number(currentUser.id);
            const otherId = Number(friend.id);
            if (!myId || !otherId) return;

            privateCallRoom = `dm_call_${Math.min(myId, otherId)}_${Math.max(myId, otherId)}`;
            activePrivateCallPeer = { targetUserId: otherId, isVideo: !!isVideo };
            isPrivateCallActive = true;

            // Mostra o overlay de chamada dentro da DM
            if (dmPrivateCallOverlay) dmPrivateCallOverlay.classList.remove('hidden');
            if (dmCallStatusBadge) dmCallStatusBadge.textContent = 'Chamando...';
            if (dmRemoteUserBadge) dmRemoteUserBadge.textContent = friend.display_name || friend.username || 'Amigo';

            // Inicia mídia local
            try {
                await getOrCreateMicrophone();
                if (isVideo) {
                    cameraStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
                    });
                    if (dmLocalVideo) {
                        dmLocalVideo.style.transform = 'scaleX(-1)';
                        dmLocalVideo.srcObject = cameraStream;
                    }
                    if (dmLocalPlaceholder) dmLocalPlaceholder.style.opacity = '0';
                    updateAllPeersVideoTrack(cameraStream.getVideoTracks()[0]);
                } else {
                    if (dmLocalPlaceholder) dmLocalPlaceholder.style.opacity = '1';
                }
            } catch (mediaErr) {
                console.warn('Aviso de mídia na chamada privada:', mediaErr);
            }

            // Conecta na sala privada isolada via Socket.IO
            socket.emit('join-room', privateCallRoom);

            // Emite convite de chamada privada via Socket.IO
            socket.emit('dm-call-invite', {
                targetUserId: otherId,
                isVideo: !!isVideo,
                callRoom: privateCallRoom
            });

            startPrivateCallTimer();
        }

        function startPrivateCallTimer() {
            stopPrivateCallTimer();
            privateCallStartTime = Date.now();
            if (dmCallTimer) dmCallTimer.textContent = '00:00';
            privateCallTimerInterval = setInterval(() => {
                if (!privateCallStartTime) return;
                const elapsed = Math.floor((Date.now() - privateCallStartTime) / 1000);
                const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const secs = String(elapsed % 60).padStart(2, '0');
                if (dmCallTimer) dmCallTimer.textContent = `${mins}:${secs}`;
            }, 1000);
        }

        function stopPrivateCallTimer() {
            if (privateCallTimerInterval) {
                clearInterval(privateCallTimerInterval);
                privateCallTimerInterval = null;
            }
            privateCallStartTime = null;
        }

        function handleIncomingCall(data) {
            if (!data) return;
            console.log('📞 Chamada privada recebida:', data);
            pendingIncomingCallData = data;
            soundManager.play('call_ring');

            if (incomingCallUsername) {
                incomingCallUsername.textContent = data.callerDisplayName || data.callerUsername || 'Amigo';
            }
            if (incomingCallType) {
                incomingCallType.textContent = data.isVideo ? 'Chamada de Vídeo WebRTC' : 'Chamada de Voz P2P';
            }
            if (incomingCallAvatar) {
                incomingCallAvatar.textContent = '';
                if (data.callerAvatarUrl) {
                    const img = document.createElement('img');
                    img.src = data.callerAvatarUrl;
                    img.className = 'user-avatar-img';
                    img.alt = data.callerDisplayName || 'Avatar';
                    incomingCallAvatar.appendChild(img);
                } else {
                    incomingCallAvatar.textContent = getServerInitials(data.callerDisplayName || data.callerUsername || 'NX');
                }
            }

            if (modalIncomingCall) {
                modalIncomingCall.classList.remove('hidden');
            }
        }

        async function acceptIncomingCallAction() {
            if (!pendingIncomingCallData) return;
            const callData = pendingIncomingCallData;
            pendingIncomingCallData = null;

            if (modalIncomingCall) modalIncomingCall.classList.add('hidden');

            socket.emit('dm-call-response', {
                targetUserId: callData.callerId,
                accepted: true,
                callRoom: callData.callRoom
            });

            // Localiza ou monta o objeto do amigo
            const friendObj = (cachedFriendships.accepted || []).find(f => f.id === callData.callerId) || {
                id: callData.callerId,
                username: callData.callerUsername,
                display_name: callData.callerDisplayName,
                avatar_url: callData.callerAvatarUrl
            };

            await openDirectMessageChat(friendObj);

            // Inicia o WebRTC na sala privada
            privateCallRoom = callData.callRoom;
            activePrivateCallPeer = { targetUserId: callData.callerId, isVideo: !!callData.isVideo };
            isPrivateCallActive = true;

            if (dmPrivateCallOverlay) dmPrivateCallOverlay.classList.remove('hidden');
            if (dmCallStatusBadge) dmCallStatusBadge.textContent = 'Conectando...';
            if (dmRemoteUserBadge) dmRemoteUserBadge.textContent = friendObj.display_name || friendObj.username || 'Amigo';

            try {
                await getOrCreateMicrophone();
                if (callData.isVideo) {
                    cameraStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
                    });
                    if (dmLocalVideo) {
                        dmLocalVideo.style.transform = 'scaleX(-1)';
                        dmLocalVideo.srcObject = cameraStream;
                    }
                    if (dmLocalPlaceholder) dmLocalPlaceholder.style.opacity = '0';
                    updateAllPeersVideoTrack(cameraStream.getVideoTracks()[0]);
                } else {
                    if (dmLocalPlaceholder) dmLocalPlaceholder.style.opacity = '1';
                }
            } catch (mediaErr) {
                console.warn('Aviso de mídia ao atender chamada:', mediaErr);
            }

            socket.emit('join-room', callData.callRoom);
            startPrivateCallTimer();
        }

        function declineIncomingCallAction() {
            if (!pendingIncomingCallData) return;
            const callData = pendingIncomingCallData;
            pendingIncomingCallData = null;

            if (modalIncomingCall) modalIncomingCall.classList.add('hidden');

            socket.emit('dm-call-response', {
                targetUserId: callData.callerId,
                accepted: false,
                callRoom: callData.callRoom
            });
        }

        function endPrivateCallAction() {
            if (!isPrivateCallActive && !privateCallRoom) return;

            const roomToEnd = privateCallRoom;
            const targetPeer = activePrivateCallPeer;

            isPrivateCallActive = false;
            stopPrivateCallTimer();

            if (targetPeer && roomToEnd && socket.connected) {
                socket.emit('dm-call-end', {
                    targetUserId: targetPeer.targetUserId,
                    callRoom: roomToEnd
                });
            }

            if (roomToEnd && socket.connected) {
                socket.emit('leave-room', roomToEnd);
            }

            // Teardown das mídias da chamada DM
            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
                cameraStream = null;
            }
            if (micStream) {
                micStream.getTracks().forEach(t => t.stop());
                micStream = null;
            }
            localStream.getTracks().forEach(t => t.stop());

            for (const peerId of Object.keys(peerConnections)) {
                closePeerConnection(peerId);
            }

            if (peerAudioNodes['dm-remote']) {
                try {
                    peerAudioNodes['dm-remote'].sourceNode.disconnect();
                    peerAudioNodes['dm-remote'].gainNode.disconnect();
                } catch(e) {}
                delete peerAudioNodes['dm-remote'];
            }

            if (dmPrivateCallOverlay) dmPrivateCallOverlay.classList.add('hidden');
            if (dmLocalVideo) dmLocalVideo.srcObject = null;
            if (dmLocalPlaceholder) dmLocalPlaceholder.style.opacity = '1';
            if (dmRemoteVideo) dmRemoteVideo.srcObject = null;
            if (dmRemotePlaceholder) dmRemotePlaceholder.style.opacity = '1';

            privateCallRoom = null;
            activePrivateCallPeer = null;
            updateLocalStatus();
        }

        function handlePrivateCallResponse(data) {
            if (!data) return;
            if (!data.accepted) {
                alert(`${data.responderUsername || 'O usuário'} recusou ou não pôde atender a chamada.`);
                endPrivateCallAction();
            } else {
                if (dmCallStatusBadge) dmCallStatusBadge.textContent = 'Conectado';
            }
        }

        function handlePrivateCallEnded(data) {
            console.log('📴 Chamada privada encerrada pelo outro participante:', data);
            stopPrivateCallTimer();
            isPrivateCallActive = false;

            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
                cameraStream = null;
            }
            if (micStream) {
                micStream.getTracks().forEach(t => t.stop());
                micStream = null;
            }
            localStream.getTracks().forEach(t => t.stop());

            for (const peerId of Object.keys(peerConnections)) {
                closePeerConnection(peerId);
            }

            if (peerAudioNodes['dm-remote']) {
                try {
                    peerAudioNodes['dm-remote'].sourceNode.disconnect();
                    peerAudioNodes['dm-remote'].gainNode.disconnect();
                } catch(e) {}
                delete peerAudioNodes['dm-remote'];
            }

            if (dmPrivateCallOverlay) dmPrivateCallOverlay.classList.add('hidden');
            if (dmLocalVideo) dmLocalVideo.srcObject = null;
            if (dmLocalPlaceholder) dmLocalPlaceholder.style.opacity = '1';
            if (dmRemoteVideo) dmRemoteVideo.srcObject = null;
            if (dmRemotePlaceholder) dmRemotePlaceholder.style.opacity = '1';

            privateCallRoom = null;
            activePrivateCallPeer = null;
            updateLocalStatus();
        }

        function handleUserPresence(data) {
            if (!data?.userId) return;
            if (data.status === 'online') {
                onlineUserIdsSet.add(Number(data.userId));
            } else {
                onlineUserIdsSet.delete(Number(data.userId));
            }

            updateFriendsBadges();
            renderFriendsList();
            renderDirectMessagesList();

            // Atualiza status do amigo no topo da DM se estiver aberta
            if (activeDmUserId === Number(data.userId)) {
                const isOnline = data.status === 'online';
                if (dmFriendStatusDot) {
                    dmFriendStatusDot.className = `friend-status-dot ${isOnline ? 'status-online' : 'status-offline'}`;
                }
                if (dmFriendPresenceText) {
                    dmFriendPresenceText.textContent = isOnline ? 'Disponível / Online' : 'Offline';
                }
            }

            // Atualiza barra lateral de membros do servidor ativo
            if (activeServerId && currentServerMembersList.length > 0) {
                renderServerMembersSidebar(currentServerMembersList);
            }
        }

        async function sendFriendRequestAction(targetUsername) {
            if (!targetUsername || !authToken) return;
            if (addFriendAlert) {
                addFriendAlert.className = 'auth-alert';
                addFriendAlert.textContent = 'Enviando pedido de amizade...';
                addFriendAlert.style.display = 'block';
            }

            try {
                const res = await fetch('/friends/request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ target_username: targetUsername })
                });

                const data = await res.json();
                if (!res.ok) {
                    if (addFriendAlert) {
                        addFriendAlert.className = 'auth-alert error';
                        addFriendAlert.textContent = data.error || 'Não foi possível enviar o pedido de amizade.';
                        addFriendAlert.style.display = 'block';
                    }
                    return;
                }

                if (addFriendAlert) {
                    addFriendAlert.className = 'auth-alert success';
                    addFriendAlert.textContent = data.message || 'Pedido de amizade enviado com sucesso!';
                    addFriendAlert.style.display = 'block';
                }

                if (inputAddFriendUsername) inputAddFriendUsername.value = '';

                // Emite sinal via Socket para atualização em tempo real
                socket.emit('friend-request-sent', { targetUserId: data.friendship?.user_id_2 });

                await fetchFriendsList();
            } catch (err) {
                console.error('Erro ao enviar pedido de amizade:', err);
                if (addFriendAlert) {
                    addFriendAlert.className = 'auth-alert error';
                    addFriendAlert.textContent = 'Erro de conexão com o servidor.';
                    addFriendAlert.style.display = 'block';
                }
            }
        }

        async function respondFriendRequestAction(friendshipId, action) {
            if (!friendshipId || !action || !authToken) return;
            try {
                const res = await fetch('/friends/respond', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ friendship_id: friendshipId, action: action })
                });

                if (res.ok) {
                    socket.emit('friend-request-status-changed', { friendshipId, action });
                    await fetchFriendsList();
                }
            } catch (err) {
                console.error('Erro ao responder solicitação de amizade:', err);
            }
        }

        // Listeners do Hub Social & DM
        if (tabFriendsOnline) tabFriendsOnline.addEventListener('click', () => { closeDirectMessageChat(); switchSocialTab('online'); });
        if (tabFriendsAll) tabFriendsAll.addEventListener('click', () => { closeDirectMessageChat(); switchSocialTab('all'); });
        if (tabFriendsPending) tabFriendsPending.addEventListener('click', () => { closeDirectMessageChat(); switchSocialTab('pending'); });
        if (tabFriendsAdd) tabFriendsAdd.addEventListener('click', () => { closeDirectMessageChat(); switchSocialTab('add'); });
        if (btnHomeNavFriends) btnHomeNavFriends.addEventListener('click', () => { closeDirectMessageChat(); switchSocialTab('online'); });
        if (inputSearchFriends) inputSearchFriends.addEventListener('input', () => renderFriendsList());
        if (btnDmBackToFriends) btnDmBackToFriends.addEventListener('click', closeDirectMessageChat);

        if (formDmChat) {
            formDmChat.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = inputDmMessage?.value;
                if (text) sendDmAction(text);
            });
        }

        if (btnDmStartVoiceCall) {
            btnDmStartVoiceCall.addEventListener('click', () => {
                if (activeDmFriendObj) startPrivateCall(activeDmFriendObj, false);
            });
        }

        if (btnDmStartVideoCall) {
            btnDmStartVideoCall.addEventListener('click', () => {
                if (activeDmFriendObj) startPrivateCall(activeDmFriendObj, true);
            });
        }

        if (btnDmEndCall) {
            btnDmEndCall.addEventListener('click', endPrivateCallAction);
        }

        const btnDmReturnToChat = document.getElementById('btnDmReturnToChat');
        if (btnDmReturnToChat) {
            btnDmReturnToChat.addEventListener('click', () => {
                if (activeDmFriendObj) {
                    openHomePanel();
                    openDirectMessageChat(activeDmFriendObj);
                }
            });
        }

        if (btnAcceptIncomingCall) {
            btnAcceptIncomingCall.addEventListener('click', acceptIncomingCallAction);
        }

        if (btnDeclineIncomingCall) {
            btnDeclineIncomingCall.addEventListener('click', declineIncomingCallAction);
        }

        if (formAddFriend) {
            formAddFriend.addEventListener('submit', (e) => {
                e.preventDefault();
                const usernameVal = (inputAddFriendUsername?.value || '').trim();
                if (usernameVal) sendFriendRequestAction(usernameVal);
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', () => logoutApp('Você saiu da sua conta.'));
        }
        if (btnLogoutHome) {
            btnLogoutHome.addEventListener('click', () => logoutApp('Você saiu da sua conta.'));
        }

        if (btnOpenUserSettingsHome) {
            btnOpenUserSettingsHome.addEventListener('click', () => {
                if (btnOpenUserSettings) btnOpenUserSettings.click();
            });
        }
        if (userBarMuteBtnHome) {
            userBarMuteBtnHome.addEventListener('click', () => {
                if (btnMute) btnMute.click();
            });
        }

        // Socket listeners para Hub Social & DMs & Chamadas Privadas
        socket.on('receive-dm', handleIncomingDm);
        socket.on('direct-message-received', handleIncomingDm);
        socket.on('dm-incoming-call', handleIncomingCall);
        socket.on('dm-call-response', handlePrivateCallResponse);
        socket.on('dm-call-ended', handlePrivateCallEnded);
        socket.on('user-presence', handleUserPresence);
        socket.on('online-users-list', (onlineList) => {
            if (Array.isArray(onlineList)) {
                onlineUserIdsSet = new Set(onlineList.map(Number));
                updateFriendsBadges();
                renderFriendsList();
                renderDirectMessagesList();
                if (activeServerId && currentServerMembersList.length > 0) {
                    renderServerMembersSidebar(currentServerMembersList);
                }
            }
        });

        socket.on('friend-request-received', (data) => {
            console.log('📬 Nova solicitação de amizade recebida:', data);
            fetchFriendsList();
        });

        socket.on('friend-request-updated', (data) => {
            console.log('🔄 Atualização de solicitação de amizade:', data);
            fetchFriendsList();
        });

        // ==========================================
        // Gestão de Convites para Servidores (Server Invites Sprint)
        // ==========================================
        async function openInviteModal() {
            if (!activeServerId || !activeServerObj) {
                alert('Selecione um servidor para gerar o convite.');
                return;
            }

            if (inviteModalServerName) {
                inviteModalServerName.textContent = `Convite para ${activeServerObj.nome}`;
            }

            if (inputInviteUrl) {
                inputInviteUrl.value = 'Gerando link de convite...';
            }

            if (btnCopyInviteUrl) {
                btnCopyInviteUrl.classList.remove('copied');
                if (labelCopyInvite) labelCopyInvite.textContent = 'Copiar';
                if (iconCopyInvite) {
                    iconCopyInvite.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />`;
                }
            }

            if (modalInviteServer) {
                modalInviteServer.style.display = 'flex';
            }

            try {
                const res = await fetch(`/servers/${activeServerId}/invites`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ expires_in_days: 7 })
                });

                const data = await res.json();
                if (!res.ok) {
                    if (inputInviteUrl) inputInviteUrl.value = 'Erro ao gerar link de convite.';
                    return;
                }

                if (inputInviteUrl && data.invite) {
                    inputInviteUrl.value = data.invite.inviteUrl;
                }
            } catch (err) {
                console.error('Erro ao gerar convite do servidor:', err);
                if (inputInviteUrl) inputInviteUrl.value = 'Erro de conexão com o servidor.';
            }
        }

        function closeInviteModal() {
            if (modalInviteServer) modalInviteServer.style.display = 'none';
        }

        async function copyInviteUrlAction() {
            const url = inputInviteUrl?.value;
            if (!url || url.startsWith('Gerando') || url.startsWith('Erro')) return;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(url);
                } else {
                    inputInviteUrl.select();
                    document.execCommand('copy');
                }

                if (btnCopyInviteUrl) {
                    btnCopyInviteUrl.classList.add('copied');
                    if (labelCopyInvite) labelCopyInvite.textContent = 'Copiado!';
                    if (iconCopyInvite) {
                        iconCopyInvite.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />`;
                    }
                }

                // Exibe toast flutuante
                if (toastCopied) {
                    toastCopied.textContent = 'Link de convite copiado para a área de transferência!';
                    toastCopied.classList.add('show');
                    setTimeout(() => toastCopied.classList.remove('show'), 2500);
                }

                setTimeout(() => {
                    if (btnCopyInviteUrl) {
                        btnCopyInviteUrl.classList.remove('copied');
                        if (labelCopyInvite) labelCopyInvite.textContent = 'Copiar';
                        if (iconCopyInvite) {
                            iconCopyInvite.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />`;
                        }
                    }
                }, 3000);
            } catch (err) {
                console.error('Falha ao copiar link de convite:', err);
                inputInviteUrl.select();
                document.execCommand('copy');
            }
        }

        // Verificação de Parâmetro de Convite na URL (?invite=CODE)
        async function checkUrlInviteParam() {
            const urlParams = new URLSearchParams(window.location.search);
            const inviteCode = urlParams.get('invite');

            if (!inviteCode) return;

            pendingInviteCode = inviteCode.trim();
            console.log(`🔗 Parâmetro de convite detectado na URL: [${pendingInviteCode}]`);

            try {
                const res = await fetch(`/invites/${pendingInviteCode}`);
                const data = await res.json();

                if (!res.ok || !data.valid) {
                    console.warn('Convite inválido ou expirado:', data);
                    alert(data.error || (data.is_expired ? 'Este link de convite expirou.' : 'Convite inválido ou expirado.'));
                    return;
                }

                openAcceptInviteModal(data);
            } catch (err) {
                console.error('Erro ao verificar convite na URL:', err);
            }
        }

        function openAcceptInviteModal(inviteData) {
            if (!inviteData || !inviteData.server) return;

            if (acceptInviteServerName) {
                acceptInviteServerName.textContent = inviteData.server.nome || 'Comunidade Nexus';
            }

            if (acceptInviteInviter) {
                const inviterName = inviteData.inviter?.display_name || inviteData.inviter?.username || 'Um membro';
                acceptInviteInviter.textContent = `${inviterName} convidou você para entrar`;
            }

            if (acceptInviteMemberCount) {
                const total = inviteData.server.total_members || 1;
                acceptInviteMemberCount.textContent = `👥 ${total} membro${total > 1 ? 's' : ''} participante${total > 1 ? 's' : ''}`;
            }

            if (acceptInviteServerAvatar) {
                acceptInviteServerAvatar.textContent = '';
                if (inviteData.server.icon_url) {
                    const img = document.createElement('img');
                    img.src = inviteData.server.icon_url;
                    img.alt = inviteData.server.nome;
                    acceptInviteServerAvatar.appendChild(img);
                } else {
                    acceptInviteServerAvatar.textContent = getServerInitials(inviteData.server.nome || 'NX');
                }
            }

            if (acceptInviteAlert) {
                acceptInviteAlert.style.display = 'none';
                acceptInviteAlert.textContent = '';
            }

            if (modalAcceptInvite) {
                modalAcceptInvite.style.display = 'flex';
            }
        }

        function closeAcceptInviteModal() {
            if (modalAcceptInvite) modalAcceptInvite.style.display = 'none';
            pendingInviteCode = null;
            // Limpa a query string da URL sem recarregar a página
            if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            }
        }

        async function confirmAcceptInviteAction() {
            if (!pendingInviteCode) return;

            if (!authToken) {
                if (acceptInviteAlert) {
                    acceptInviteAlert.className = 'auth-alert error';
                    acceptInviteAlert.textContent = 'Você precisa estar logado para entrar no servidor.';
                    acceptInviteAlert.style.display = 'block';
                }
                showAuthGate('Faça login ou crie sua conta para aceitar o convite.');
                return;
            }

            try {
                if (btnConfirmAcceptInvite) {
                    btnConfirmAcceptInvite.disabled = true;
                    btnConfirmAcceptInvite.textContent = 'Entrando no Servidor...';
                }

                const res = await fetch(`/invites/${pendingInviteCode}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                const data = await res.json();
                if (!res.ok) {
                    if (acceptInviteAlert) {
                        acceptInviteAlert.className = 'auth-alert error';
                        acceptInviteAlert.textContent = data.error || 'Falha ao aceitar convite.';
                        acceptInviteAlert.style.display = 'block';
                    }
                    return;
                }

                console.log('🎉 Entrada no servidor confirmada:', data);

                closeAcceptInviteModal();

                // Recarrega lista de servidores e seleciona o servidor recém-adicionado
                await fetchServersList();

                if (data.server) {
                    selectServer(data.server);
                }
            } catch (err) {
                console.error('Erro ao aceitar convite:', err);
                if (acceptInviteAlert) {
                    acceptInviteAlert.className = 'auth-alert error';
                    acceptInviteAlert.textContent = 'Erro de conexão ao aceitar convite.';
                    acceptInviteAlert.style.display = 'block';
                }
            } finally {
                if (btnConfirmAcceptInvite) {
                    btnConfirmAcceptInvite.disabled = false;
                    btnConfirmAcceptInvite.textContent = 'Entrar no Servidor';
                }
            }
        }

        // Listeners de Convite
        if (btnOpenInviteModal) btnOpenInviteModal.addEventListener('click', openInviteModal);
        if (btnCloseInviteModal) btnCloseInviteModal.addEventListener('click', closeInviteModal);
        if (btnCopyInviteUrl) btnCopyInviteUrl.addEventListener('click', copyInviteUrlAction);
        if (btnDeclineInviteModal) btnDeclineInviteModal.addEventListener('click', closeAcceptInviteModal);
        if (btnConfirmAcceptInvite) btnConfirmAcceptInvite.addEventListener('click', confirmAcceptInviteAction);

        // Socket listener para novo membro entrando no servidor em tempo real
        socket.on('member-joined', (data) => {
            console.log('🎉 Evento member-joined recebido via Socket.IO:', data);
            if (!data) return;

            // Se o servidor for o atualmente ativo
            if (activeServerId && Number(data.serverId) === Number(activeServerId)) {
                fetchAndRenderServerMembersSidebar(activeServerId);
                // Atualiza abas de membros se estiverem abertas
                if (typeof loadServerMembersInSettings === 'function' && serverSettingsOverlay && !serverSettingsOverlay.classList.contains('hidden')) {
                    loadServerMembersInSettings();
                }
                if (typeof loadServerRolesAndMembersInSettings === 'function' && serverSettingsOverlay && !serverSettingsOverlay.classList.contains('hidden')) {
                    loadServerRolesAndMembersInSettings();
                }
            }

            // Se o usuário que acabou de entrar for o usuário logado neste cliente
            if (currentUser && data.user && Number(data.user.user_id) === Number(currentUser.id)) {
                fetchServersList();
            }
        });

        async function selectServer(server) {
            if (!server) return;
            activeServerId = server.id;
            activeServerObj = server;

            openServerPanel();

            document.querySelectorAll('.server-icon-wrapper').forEach(el => el.classList.remove('active'));
            const activeEl = document.getElementById(`server-item-${server.id}`);
            if (activeEl) activeEl.classList.add('active');

            if (selectedServerTitle) selectedServerTitle.innerText = server.nome || 'Servidor';
            if (mainServerHeading) mainServerHeading.innerText = server.nome || 'Servidor';
            if (welcomeServerTitle) welcomeServerTitle.innerText = `Bem-vindo ao ${server.nome || 'Servidor'}!`;
            if (mainHeaderSub) mainHeaderSub.innerText = `Comunidade: ${server.nome || 'Servidor'} • Navegue pelos canais à esquerda`;

            applyServerMediaVisuals(server);

            setViewMode('empty');
            await fetchServerChannels(server.id);
            await fetchAndRenderServerMembersSidebar(server.id);
        }

        if (btnServerHome) {
            btnServerHome.addEventListener('click', () => {
                openHomePanel();
            });
        }

        if (btnOpenServerHome) {
            btnOpenServerHome.addEventListener('click', () => {
                if (activeServerObj) setViewMode('empty');
            });
        }

        // ==========================================
        // 5. Canais & Alternância do Palco
        // ==========================================
        async function fetchServerChannels(serverId) {
            if (!serverId) {
                loadedChannels = [];
                renderChannels([]);
                return;
            }
            try {
                if (textChannelsList) {
                    textChannelsList.textContent = '';
                    const loadingDiv = document.createElement('div');
                    loadingDiv.style.cssText = 'font-size: 0.8rem; color: #64748b; padding: 6px;';
                    loadingDiv.textContent = 'Carregando canais...';
                    textChannelsList.appendChild(loadingDiv);
                }
                if (voiceChannelsList) voiceChannelsList.textContent = '';

                const res = await fetch(`/servers/${serverId}/channels`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await res.json();

                if (data && data.channels && Array.isArray(data.channels)) {
                    loadedChannels = data.channels;
                    renderChannels(loadedChannels);
                } else {
                    loadedChannels = [];
                    renderChannels([]);
                }
            } catch (err) {
                console.error('Erro ao buscar canais:', err);
                loadedChannels = [];
                renderChannels([]);
            }
        }

        function renderChannels(channels) {
            if (textChannelsList) textChannelsList.textContent = '';
            if (voiceChannelsList) voiceChannelsList.textContent = '';

            const textChannels = channels.filter(c => c.tipo === 'texto');
            const voiceChannels = channels.filter(c => c.tipo === 'voz');

            // Verifica permissão do usuário atual para gerenciar canais
            const isOwner = Boolean(activeServerObj && currentUser && Number(activeServerObj.dono_id) === Number(currentUser.id));
            const currentMemberObj = (currentServerMembersList || []).find(m => Number(m.user_id) === Number(currentUser?.id));
            const currentMemberRoles = Array.isArray(currentMemberObj?.roles) ? currentMemberObj.roles : [];
            const canManageChannels = isOwner || currentMemberRoles.some(r => {
                const name = (r.nome || '').toLowerCase();
                return name === 'admin' || name === 'administrador' || name === 'moderador' ||
                       r.permissoes?.can_manage_channels || r.permissoes?.can_manage_server;
            });

            if (textChannels.length === 0) {
                if (textChannelsList) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.style.cssText = 'font-size: 0.78rem; color: #64748b; padding: 4px 8px;';
                    emptyDiv.textContent = 'Nenhum canal de texto';
                    textChannelsList.appendChild(emptyDiv);
                }
            } else {
                textChannels.forEach(c => {
                    const item = document.createElement('div');
                    item.className = `channel-item ${activeChannelId === c.id ? 'active' : ''}`;
                    item.id = `channel-item-${c.id}`;

                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'channel-icon';
                    iconSpan.textContent = '#';

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'channel-name';
                    nameSpan.textContent = c.nome;

                    item.appendChild(iconSpan);
                    item.appendChild(nameSpan);

                    // Ícone de engrenagem flutuante para personalização/moderação do canal (Sprint: Gestão de Canais)
                    if (canManageChannels) {
                        const btnGear = document.createElement('button');
                        btnGear.type = 'button';
                        btnGear.className = 'btn-channel-settings';
                        btnGear.title = 'Configurações do Canal';
                        btnGear.innerHTML = `
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        `;
                        btnGear.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openChannelSettingsModal(c);
                        });
                        item.appendChild(btnGear);
                    }

                    item.addEventListener('click', () => selectTextChannel(c));
                    if (textChannelsList) textChannelsList.appendChild(item);
                });
            }

            if (voiceChannels.length === 0) {
                if (voiceChannelsList) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.style.cssText = 'font-size: 0.78rem; color: #64748b; padding: 4px 8px;';
                    emptyDiv.textContent = 'Nenhum canal de voz';
                    voiceChannelsList.appendChild(emptyDiv);
                }
            } else {
                voiceChannels.forEach(c => {
                    const item = document.createElement('div');
                    item.className = `channel-item ${activeChannelId === c.id ? 'active' : ''}`;
                    item.id = `channel-item-${c.id}`;

                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'channel-icon';
                    iconSpan.innerHTML = `
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                        </svg>
                    `;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'channel-name';
                    nameSpan.textContent = c.nome;

                    item.appendChild(iconSpan);
                    item.appendChild(nameSpan);

                    // Ícone de engrenagem flutuante para personalização/moderação do canal (Sprint: Gestão de Canais)
                    if (canManageChannels) {
                        const btnGear = document.createElement('button');
                        btnGear.type = 'button';
                        btnGear.className = 'btn-channel-settings';
                        btnGear.title = 'Configurações do Canal';
                        btnGear.innerHTML = `
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        `;
                        btnGear.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openChannelSettingsModal(c);
                        });
                        item.appendChild(btnGear);
                    }

                    item.addEventListener('click', () => selectVoiceChannel(c));
                    if (voiceChannelsList) voiceChannelsList.appendChild(item);
                });
            }
        }

        function selectTextChannel(channel) {
            activeChannelId = channel.id;
            activeTextChannelObj = channel;
            currentActiveChannelObj = channel;
            highlightActiveChannel(channel.id);

            const textRoomName = `comunidade-${activeServerId}-txt-${channel.nome}`;

            if (mainChatChannelName) mainChatChannelName.innerText = channel.nome;
            if (mainChatChannelTopic) mainChatChannelTopic.innerText = `Canal de texto da comunidade • #${channel.nome}`;
            if (channelWelcomeHeading) channelWelcomeHeading.innerText = `Bem-vindo ao #${channel.nome}!`;
            if (channelWelcomeDesc) channelWelcomeDesc.innerText = `Este é o início do canal #${channel.nome}. As mensagens são persistidas no PostgreSQL.`;
            if (mainChatExpandedInput) mainChatExpandedInput.placeholder = `Conversar em #${channel.nome}...`;

            setViewMode('text');

            // Gerencia a troca de salas de texto via Socket.IO sem interromper a chamada de voz em segundo plano (Sprint 6)
            if (currentTextRoom && currentTextRoom !== textRoomName) {
                socket.emit('leave-room', currentTextRoom);
            }
            currentTextRoom = textRoomName;
            currentRoom = textRoomName; // Sincroniza sala ativa de texto para o chat
            socket.emit('join-room', currentTextRoom);
            console.log(`💬 [Canal de Texto] Entrou na sala de texto: "${currentTextRoom}" (Voz ativa: "${currentVoiceRoom || 'nenhuma'}")`);
        }

        async function selectVoiceChannel(channel) {
            activeChannelId = channel.id;
            activeVoiceChannelObj = channel;
            currentActiveChannelObj = channel;
            highlightActiveChannel(channel.id);

            const voiceRoomName = `comunidade-${activeServerId}-voz-${channel.nome}`;
            if (voiceChannelHeading) voiceChannelHeading.innerText = `🔊 Canal de Voz: ${channel.nome}`;
            if (chatPanelTitle) chatPanelTitle.innerText = `Chat de Apoio • ${channel.nome}`;
            if (persistentVoiceChannelName) persistentVoiceChannelName.innerText = `#${channel.nome}`;
            if (persistentVoiceChannelNameHome) persistentVoiceChannelNameHome.innerText = `#${channel.nome}`;

            // Se já estiver neste mesmo canal de voz, apenas exibe a visualização completa
            if (currentVoiceRoom === voiceRoomName) {
                setViewMode('voice');
                return;
            }

            // Se estiver em outro canal de voz, realiza o teardown prévio antes de entrar no novo
            if (currentVoiceRoom && currentVoiceRoom !== voiceRoomName) {
                leaveVoiceChannel(true);
            }

            currentVoiceRoom = voiceRoomName;
            socket.emit('join-room', currentVoiceRoom);
            console.log(`🎙️ [Canal de Voz] Conectando ao canal de voz: "${currentVoiceRoom}"`);

            soundManager.play('join');
            setViewMode('voice');
            await getOrCreateMicrophone();
            updateGridLayout();
        }

        function highlightActiveChannel(channelId) {
            document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
            const activeEl = document.getElementById(`channel-item-${channelId}`);
            if (activeEl) activeEl.classList.add('active');
        }

        if (btnQuickEnterGeneralText) {
            btnQuickEnterGeneralText.addEventListener('click', () => {
                const firstText = loadedChannels.find(c => c.tipo === 'texto');
                if (firstText) selectTextChannel(firstText);
                else if (loadedChannels.length > 0) selectTextChannel(loadedChannels[0]);
            });
        }

        if (btnQuickEnterGeneralVoice) {
            btnQuickEnterGeneralVoice.addEventListener('click', () => {
                const firstVoice = loadedChannels.find(c => c.tipo === 'voz');
                if (firstVoice) selectVoiceChannel(firstVoice);
                else if (loadedChannels.length > 0) selectVoiceChannel(loadedChannels[0]);
            });
        }

        // ==========================================
        // 5.1. Barra Lateral de Membros & Hierarquia de Cargos (Sprint: Hierarquia e Membros)
        // ==========================================
        async function fetchAndRenderServerMembersSidebar(serverId) {
            if (!serverId) {
                currentServerMembersList = [];
                renderServerMembersSidebar([]);
                return;
            }

            try {
                if (membersListContainer) {
                    membersListContainer.innerHTML = `
                        <div class="members-loading-state">
                            <div class="spinner-sm"></div>
                            <span>Carregando membros...</span>
                        </div>
                    `;
                }

                const res = await fetch(`/api/servers/${serverId}/members`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (!res.ok) {
                    const fallbackRes = await fetch(`/servers/${serverId}/members`, {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    if (!fallbackRes.ok) throw new Error('Falha ao carregar membros do servidor.');
                    const fallbackData = await fallbackRes.json();
                    currentServerMembersList = fallbackData.members || [];
                } else {
                    const data = await res.json();
                    currentServerMembersList = data.members || [];
                }

                renderServerMembersSidebar(currentServerMembersList);
            } catch (err) {
                console.error('Erro ao buscar membros para a barra lateral:', err);
                if (membersListContainer) {
                    membersListContainer.innerHTML = `
                        <div class="members-empty-state">
                            <span style="color: #f87171;">⚠️ Não foi possível carregar os membros.</span>
                        </div>
                    `;
                }
            }
        }

        function renderServerMembersSidebar(members) {
            if (!membersListContainer) return;
            membersListContainer.textContent = '';

            if (membersCountBadge) {
                membersCountBadge.textContent = String(members?.length || 0);
            }

            if (!members || members.length === 0) {
                membersListContainer.innerHTML = `
                    <div class="members-empty-state">
                        <span>Nenhum membro encontrado.</span>
                    </div>
                `;
                return;
            }

            // 1. Agrupa os membros por Cargo Mais Alto com Hoist ou Posição (Hierarchy)
            const roleGroupsMap = new Map();

            members.forEach(member => {
                const isOnline = onlineUserIdsSet.has(Number(member.user_id));
                const memberRoles = Array.isArray(member.roles) ? member.roles : [];
                
                // Encontra o cargo mais alto com hoist ou o mais alto geral
                const topRole = memberRoles.find(r => r.hoist === true) || memberRoles[0] || null;

                // Se o membro é o Dono do Servidor
                const isServerOwner = Boolean(activeServerObj && Number(activeServerObj.dono_id) === Number(member.user_id));

                let groupKey = 'membros_default';
                let groupRoleName = 'Membros';
                let groupColor = '#94a3b8';
                let groupPosition = 0;

                if (topRole && topRole.nome && topRole.nome.toLowerCase() !== '@everyone') {
                    groupKey = `role_${topRole.id}`;
                    groupRoleName = topRole.nome;
                    groupColor = topRole.cor_hex || '#94a3b8';
                    groupPosition = Number(topRole.posicao) || 1;
                } else if (isServerOwner) {
                    groupKey = 'role_owner';
                    groupRoleName = 'Proprietário';
                    groupColor = '#f59e0b';
                    groupPosition = 9999;
                }

                if (!roleGroupsMap.has(groupKey)) {
                    roleGroupsMap.set(groupKey, {
                        key: groupKey,
                        nome: groupRoleName,
                        cor_hex: groupColor,
                        posicao: groupPosition,
                        members: []
                    });
                }

                roleGroupsMap.get(groupKey).members.push({
                    ...member,
                    isOnline,
                    isServerOwner,
                    topRole: topRole
                });
            });

            // 2. Ordena os grupos pela posição de cargo decrescente (Maior privilégio primeiro)
            const sortedGroups = Array.from(roleGroupsMap.values()).sort((a, b) => b.posicao - a.posicao);

            // 3. Renderiza cada grupo de cargos e seus membros
            sortedGroups.forEach(group => {
                // Ordena membros dentro do grupo: Online primeiro, depois alfabético
                group.members.sort((a, b) => {
                    if (a.isOnline && !b.isOnline) return -1;
                    if (!a.isOnline && b.isOnline) return 1;
                    const nameA = (a.nickname || a.display_name || a.username || '').toLowerCase();
                    const nameB = (b.nickname || b.display_name || b.username || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                const groupSection = document.createElement('div');
                groupSection.className = 'members-group';

                // Cabeçalho da categoria de cargo
                const groupHeader = document.createElement('div');
                groupHeader.className = 'members-group-header';
                groupHeader.style.color = group.cor_hex || 'var(--text-muted)';

                const titleSpan = document.createElement('span');
                titleSpan.textContent = `${group.nome.toUpperCase()} — ${group.members.length}`;

                groupHeader.appendChild(titleSpan);
                groupSection.appendChild(groupHeader);

                // Lista de membros do cargo
                group.members.forEach(m => {
                    const card = document.createElement('div');
                    card.className = 'member-sidebar-card';
                    card.setAttribute('data-user-id', String(m.user_id));

                    // Avatar Wrapper
                    const avatarWrap = document.createElement('div');
                    avatarWrap.className = 'member-avatar-wrapper';

                    if (m.avatar_url) {
                        const img = document.createElement('img');
                        img.src = m.avatar_url;
                        img.className = 'member-avatar-img';
                        img.alt = m.display_name || m.username;
                        img.loading = 'lazy';
                        avatarWrap.appendChild(img);
                    } else {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'member-avatar-placeholder';
                        placeholder.textContent = getServerInitials(m.nickname || m.display_name || m.username);
                        avatarWrap.appendChild(placeholder);
                    }

                    // Bolinha de status online/offline
                    const dot = document.createElement('span');
                    dot.className = `member-status-dot ${m.isOnline ? 'online' : ''}`;
                    dot.title = m.isOnline ? 'Online' : 'Offline';
                    avatarWrap.appendChild(dot);

                    // Info
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'member-info';

                    const nameRow = document.createElement('div');
                    nameRow.className = 'member-name-row';

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'member-display-name';
                    nameSpan.textContent = m.nickname || m.display_name || m.username;
                    if (group.cor_hex && group.cor_hex !== '#94a3b8') {
                        nameSpan.style.color = group.cor_hex;
                    }

                    nameRow.appendChild(nameSpan);

                    if (m.isServerOwner) {
                        const crown = document.createElement('span');
                        crown.className = 'member-owner-crown';
                        crown.textContent = '👑';
                        crown.title = 'Proprietário do Servidor';
                        nameRow.appendChild(crown);
                    }

                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'member-username-tag';
                    tagSpan.textContent = `@${m.username}`;

                    infoDiv.appendChild(nameRow);
                    infoDiv.appendChild(tagSpan);

                    // Se possuir cargo com cor especial, renderiza tag mini
                    if (m.topRole && m.topRole.nome && m.topRole.nome.toLowerCase() !== '@everyone') {
                        const roleChip = document.createElement('span');
                        roleChip.className = 'member-role-badge-mini';
                        roleChip.style.background = m.topRole.cor_hex ? `${m.topRole.cor_hex}22` : 'rgba(255,255,255,0.08)';
                        roleChip.style.border = `1px solid ${m.topRole.cor_hex || 'rgba(255,255,255,0.1)'}`;
                        roleChip.style.color = m.topRole.cor_hex || '#cbd5e1';
                        roleChip.textContent = m.topRole.nome;
                        infoDiv.appendChild(roleChip);
                    }

                    card.appendChild(avatarWrap);
                    card.appendChild(infoDiv);

                    // Ação de clique no membro: se for outro usuário, abre chat de DM
                    card.addEventListener('click', () => {
                        if (currentUser && Number(currentUser.id) !== Number(m.user_id)) {
                            const friendObj = {
                                id: Number(m.user_id),
                                username: m.username,
                                display_name: m.display_name || m.nickname || m.username,
                                avatar_url: m.avatar_url
                            };
                            openHomePanel();
                            openDirectMessageChat(friendObj);
                        }
                    });

                    groupSection.appendChild(card);
                });

                membersListContainer.appendChild(groupSection);
            });
        }

        // Listener do botão de alternar visualização da barra de membros (Sprint: Responsividade)
        if (btnToggleMembersSidebar) {
            btnToggleMembersSidebar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (membersSidebar) {
                    if (window.innerWidth <= 768) {
                        membersSidebar.classList.toggle('show');
                    } else {
                        membersSidebar.classList.toggle('hidden');
                    }
                }
            });
        }

        // Fecha a barra lateral de membros no mobile ao clicar fora dela
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && membersSidebar && membersSidebar.classList.contains('show')) {
                if (!membersSidebar.contains(e.target) && e.target !== btnToggleMembersSidebar && !btnToggleMembersSidebar?.contains(e.target)) {
                    membersSidebar.classList.remove('show');
                }
            }
        });

        // Modais de Criação de Servidor e Canal
        if (btnOpenAddServerModal) {
            btnOpenAddServerModal.addEventListener('click', () => {
                if (!authToken) {
                    logoutApp('Faça login primeiro para criar comunidades.');
                    return;
                }
                if (modalAddServer) modalAddServer.style.display = 'flex';
                if (serverModalAlert) serverModalAlert.style.display = 'none';
                if (inputServerName) {
                    inputServerName.value = '';
                    inputServerName.focus();
                }
            });
        }

        function closeAddServerModal() { if (modalAddServer) modalAddServer.style.display = 'none'; }
        if (btnCloseServerModal) btnCloseServerModal.addEventListener('click', closeAddServerModal);
        if (btnCancelServerModal) btnCancelServerModal.addEventListener('click', closeAddServerModal);

        if (formAddServer) {
            formAddServer.addEventListener('submit', async (e) => {
                e.preventDefault();
                const serverName = inputServerName?.value.trim();
                if (!serverName) return;

                try {
                    if (btnSubmitServerModal) {
                        btnSubmitServerModal.disabled = true;
                        btnSubmitServerModal.innerText = 'Criando...';
                    }

                    const res = await fetch('/servers', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({ nome: serverName })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao criar servidor');

                    closeAddServerModal();
                    await fetchServersList();
                    if (data.server) selectServer(data.server);
                } catch (err) {
                    if (serverModalAlert) {
                        serverModalAlert.className = 'auth-alert error';
                        serverModalAlert.innerText = err.message;
                        serverModalAlert.style.display = 'block';
                    }
                } finally {
                    if (btnSubmitServerModal) {
                        btnSubmitServerModal.disabled = false;
                        btnSubmitServerModal.innerText = 'Criar Comunidade';
                    }
                }
            });
        }

        if (btnOpenAddChannelModal) {
            btnOpenAddChannelModal.addEventListener('click', () => {
                if (!activeServerId) {
                    alert('Selecione um servidor antes de criar um canal.');
                    return;
                }
                if (!authToken) {
                    alert('Você precisa estar autenticado para criar canais.');
                    return;
                }
                if (modalAddChannel) modalAddChannel.style.display = 'flex';
                if (channelModalAlert) channelModalAlert.style.display = 'none';
                if (inputChannelName) {
                    inputChannelName.value = '';
                    inputChannelName.focus();
                }
                selectedChannelTypeForModal = 'texto';
                if (optTypeText) optTypeText.classList.add('selected');
                if (optTypeVoice) optTypeVoice.classList.remove('selected');
            });
        }

        if (optTypeText) {
            optTypeText.addEventListener('click', () => {
                selectedChannelTypeForModal = 'texto';
                optTypeText.classList.add('selected');
                if (optTypeVoice) optTypeVoice.classList.remove('selected');
            });
        }

        if (optTypeVoice) {
            optTypeVoice.addEventListener('click', () => {
                selectedChannelTypeForModal = 'voz';
                optTypeVoice.classList.add('selected');
                if (optTypeText) optTypeText.classList.remove('selected');
            });
        }

        function closeAddChannelModal() { if (modalAddChannel) modalAddChannel.style.display = 'none'; }
        if (btnCloseChannelModal) btnCloseChannelModal.addEventListener('click', closeAddChannelModal);
        if (btnCancelChannelModal) btnCancelChannelModal.addEventListener('click', closeAddChannelModal);

        if (formAddChannel) {
            formAddChannel.addEventListener('submit', async (e) => {
                e.preventDefault();
                const channelName = inputChannelName?.value.trim();
                if (!channelName || !activeServerId) return;

                try {
                    if (btnSubmitChannelModal) {
                        btnSubmitChannelModal.disabled = true;
                        btnSubmitChannelModal.innerText = 'Criando...';
                    }

                    const res = await fetch(`/servers/${activeServerId}/channels`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            nome: channelName,
                            tipo: selectedChannelTypeForModal
                        })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao criar canal');

                    closeAddChannelModal();
                    await fetchServerChannels(activeServerId);

                    if (data.channel) {
                        if (data.channel.tipo === 'texto') selectTextChannel(data.channel);
                        else selectVoiceChannel(data.channel);
                    }
                } catch (err) {
                    if (channelModalAlert) {
                        channelModalAlert.className = 'auth-alert error';
                        channelModalAlert.innerText = err.message;
                        channelModalAlert.style.display = 'block';
                    }
                } finally {
                    if (btnSubmitChannelModal) {
                        btnSubmitChannelModal.disabled = false;
                        btnSubmitChannelModal.innerText = 'Criar Canal';
                    }
                }
            });
        }

        // ==========================================
        // Gestão e Personalização de Canais (Sprint: Personalização de Canais)
        // ==========================================
        function openChannelSettingsModal(channel) {
            if (!channel) return;
            editingChannelObj = channel;
            if (channelSettingsSubtitle) channelSettingsSubtitle.textContent = `#${channel.nome} (${channel.tipo === 'texto' ? 'Texto' : 'Voz'})`;
            if (inputEditChannelName) inputEditChannelName.value = channel.nome;
            if (channelSettingsAlert) channelSettingsAlert.style.display = 'none';
            if (modalChannelSettings) modalChannelSettings.style.display = 'flex';
            setTimeout(() => inputEditChannelName?.focus(), 100);
        }

        function closeChannelSettingsModal() {
            editingChannelObj = null;
            if (modalChannelSettings) modalChannelSettings.style.display = 'none';
        }

        if (btnCloseChannelSettingsModal) btnCloseChannelSettingsModal.addEventListener('click', closeChannelSettingsModal);
        if (btnCancelEditChannel) btnCancelEditChannel.addEventListener('click', closeChannelSettingsModal);

        if (formEditChannel) {
            formEditChannel.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!editingChannelObj) return;

                const newName = (inputEditChannelName?.value || '').trim();
                if (!newName) return;

                try {
                    if (btnSaveChannelName) {
                        btnSaveChannelName.disabled = true;
                        btnSaveChannelName.innerText = 'Salvando...';
                    }

                    const res = await fetch(`/api/channels/${editingChannelObj.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({ nome: newName })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao renomear canal');

                    closeChannelSettingsModal();
                    await fetchServerChannels(activeServerId);
                } catch (err) {
                    if (channelSettingsAlert) {
                        channelSettingsAlert.className = 'auth-alert error';
                        channelSettingsAlert.innerText = err.message;
                        channelSettingsAlert.style.display = 'block';
                    }
                } finally {
                    if (btnSaveChannelName) {
                        btnSaveChannelName.disabled = false;
                        btnSaveChannelName.innerText = 'Salvar Alterações';
                    }
                }
            });
        }

        if (btnDeleteChannel) {
            btnDeleteChannel.addEventListener('click', async () => {
                if (!editingChannelObj) return;
                if (!confirm(`Tem certeza que deseja excluir permanentemente o canal #${editingChannelObj.nome}? Esta ação não pode ser desfeita.`)) {
                    return;
                }

                try {
                    btnDeleteChannel.disabled = true;
                    btnDeleteChannel.innerText = 'Excluindo...';

                    const res = await fetch(`/api/channels/${editingChannelObj.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao excluir canal');

                    const deletedChannelId = editingChannelObj.id;
                    closeChannelSettingsModal();
                    await fetchServerChannels(activeServerId);

                    // Se o canal excluído era o que estava ativo, seleciona o primeiro restante
                    if (activeChannelId === deletedChannelId) {
                        const remaining = loadedChannels.filter(c => c.id !== deletedChannelId);
                        if (remaining.length > 0) {
                            if (remaining[0].tipo === 'texto') selectTextChannel(remaining[0]);
                            else selectVoiceChannel(remaining[0]);
                        } else {
                            setViewMode('empty');
                        }
                    }
                } catch (err) {
                    if (channelSettingsAlert) {
                        channelSettingsAlert.className = 'auth-alert error';
                        channelSettingsAlert.innerText = err.message;
                        channelSettingsAlert.style.display = 'block';
                    }
                } finally {
                    btnDeleteChannel.disabled = false;
                    btnDeleteChannel.innerText = 'Excluir';
                }
            });
        }

        if (userBarMuteBtn) userBarMuteBtn.addEventListener('click', () => toggleMute());

        // ==========================================
        // 6. Eventos do Socket.IO & Fila de Mensagens
        // ==========================================

        // 🔄 Sprint: Personalização de Canais - Eventos em Tempo Real
        socket.on('channel-updated', (channel) => {
            if (!channel || !activeServerId || Number(activeServerId) !== Number(channel.server_id)) return;
            console.log('🔄 Canal atualizado recebido via WebSocket:', channel);

            // Atualiza lista local
            const idx = loadedChannels.findIndex(c => c.id === channel.id);
            if (idx !== -1) {
                loadedChannels[idx] = { ...loadedChannels[idx], ...channel };
            }

            // Atualiza elemento na sidebar
            const itemEl = document.getElementById(`channel-item-${channel.id}`);
            if (itemEl) {
                const nameSpan = itemEl.querySelector('.channel-name');
                if (nameSpan) nameSpan.textContent = channel.nome;
            }

            // Se o canal atualizado for o canal ativo no momento, atualiza títulos e salas
            if (activeChannelId === channel.id) {
                if (channel.tipo === 'texto') {
                    if (mainChatChannelName) mainChatChannelName.innerText = channel.nome;
                    if (mainChatChannelTopic) mainChatChannelTopic.innerText = `Canal de texto da comunidade • #${channel.nome}`;
                    if (channelWelcomeHeading) channelWelcomeHeading.innerText = `Bem-vindo ao #${channel.nome}!`;
                    if (channelWelcomeDesc) channelWelcomeDesc.innerText = `Este é o início do canal #${channel.nome}. As mensagens são persistidas no PostgreSQL.`;
                    if (mainChatExpandedInput) mainChatExpandedInput.placeholder = `Conversar em #${channel.nome}...`;
                } else {
                    if (voiceChannelHeading) voiceChannelHeading.innerText = `🔊 Canal de Voz: ${channel.nome}`;
                    if (chatPanelTitle) chatPanelTitle.innerText = `Chat de Apoio • ${channel.nome}`;
                    if (persistentVoiceChannelName) persistentVoiceChannelName.innerText = `#${channel.nome}`;
                    if (persistentVoiceChannelNameHome) persistentVoiceChannelNameHome.innerText = `#${channel.nome}`;
                }
            }
        });

        socket.on('channel-deleted', (data) => {
            if (!data || !activeServerId || Number(activeServerId) !== Number(data.server_id)) return;
            console.log('🗑️ Canal excluído recebido via WebSocket:', data);

            // Remove da lista local e da DOM
            loadedChannels = loadedChannels.filter(c => c.id !== data.id);
            const itemEl = document.getElementById(`channel-item-${data.id}`);
            if (itemEl) {
                itemEl.style.opacity = '0';
                itemEl.style.transform = 'scale(0.95)';
                itemEl.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
                setTimeout(() => itemEl.remove(), 200);
            }

            // Se o canal ativo foi excluído, redireciona
            if (activeChannelId === data.id) {
                if (currentVoiceRoom && currentVoiceRoom.includes(data.nome || '')) {
                    leaveVoiceChannel(true);
                }
                const firstRemaining = loadedChannels[0];
                if (firstRemaining) {
                    if (firstRemaining.tipo === 'texto') selectTextChannel(firstRemaining);
                    else selectVoiceChannel(firstRemaining);
                } else {
                    setViewMode('empty');
                }
            }
        });
        socket.on('connect_error', (err) => {
            console.warn('🔒 Conexão rejeitada pelo servidor Socket.IO:', err.message);
            if (socketDot) socketDot.classList.remove('connected');
            if (socketStatusText) socketStatusText.innerText = 'Socket: Acesso Negado (401)';
            if (webrtcStatusText) webrtcStatusText.innerText = 'Autenticação necessária: ' + err.message;
            logoutApp(`Erro de Autenticação no Socket: ${err.message}`);
        });

        socket.on('connect', () => {
            console.log('🟢 [Socket.IO Conectado] ID:', socket.id);
            if (socketDot) socketDot.classList.add('connected');
            if (socketStatusText) socketStatusText.innerText = `Socket: Conectado (${socket.id.substring(0, 6)}...)`;

            // Reassocia à sala ativa se houver
            if (currentRoom) {
                console.log(`🚪 [Socket.IO Reconexão] Reingressando na sala: "${currentRoom}"`);
                socket.emit('join-room', currentRoom);
            }

            // Despacha mensagens pendentes acumuladas na Message Queue
            if (pendingMessageQueue.length > 0) {
                console.log(`🚀 [Message Queue] Despachando ${pendingMessageQueue.length} mensagem(ns) acumulada(s) após reconexão...`);
                while (pendingMessageQueue.length > 0) {
                    const pendingMsg = pendingMessageQueue.shift();
                    socket.emit('chat-message', pendingMsg);
                    console.log('✉️ [Message Queue] Mensagem despachada com sucesso:', pendingMsg);
                }
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('🔴 [Socket.IO Desconectado] Motivo:', reason);
            if (socketDot) socketDot.classList.remove('connected');
            if (socketStatusText) socketStatusText.innerText = 'Socket: Desconectado (Reconectando...)';
        });

        socket.io.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 [Socket.IO] Tentativa de reconexão #${attempt}...`);
            if (socketStatusText) socketStatusText.innerText = `Socket: Reconectando (#${attempt})...`;
        });

        socket.io.on('reconnect', (attempt) => {
            console.log(`✅ [Socket.IO] Reconectado com sucesso após ${attempt} tentativa(s)!`);
        });

        socket.io.on('reconnect_error', (error) => {
            console.warn('⚠️ [Socket.IO] Falha temporária ao tentar reconectar:', error.message);
        });

        socket.io.on('reconnect_failed', () => {
            console.error('❌ [Socket.IO] Falha definitiva na reconexão.');
            if (socketStatusText) socketStatusText.innerText = 'Socket: Falha na Conexão';
        });

        async function copyRoomLinkAction() {
            if (!currentRoom) return;
            const fullUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(currentRoom)}`;
            try {
                await navigator.clipboard.writeText(fullUrl);
                if (toastCopied) {
                    toastCopied.style.display = 'flex';
                    setTimeout(() => { toastCopied.style.display = 'none'; }, 3000);
                }
            } catch (err) {
                prompt('Copie o link do canal:', fullUrl);
            }
        }

        if (btnCopyChannelLink) btnCopyChannelLink.addEventListener('click', copyRoomLinkAction);
        if (btnEmptyStateCopy) btnEmptyStateCopy.addEventListener('click', copyRoomLinkAction);

        function updateGridLayout() {
            const peerCount = Object.keys(peerConnections).length;
            if (peerCount === 0) {
                if (videoGrid) videoGrid.classList.add('single-peer');
                if (emptyStateContainer) emptyStateContainer.style.display = 'flex';
                if (voiceParticipantsCount) voiceParticipantsCount.innerText = '1 Participante (Você)';
                if (webrtcStatusText) webrtcStatusText.innerText = `Voz: Aguardando membros no canal...`;
            } else {
                if (videoGrid) videoGrid.classList.remove('single-peer');
                if (emptyStateContainer) emptyStateContainer.style.display = 'none';
                if (voiceParticipantsCount) voiceParticipantsCount.innerText = `${peerCount + 1} Participantes`;
                if (webrtcStatusText) webrtcStatusText.innerText = `Voz: Conectado com ${peerCount} membro(s)`;
            }
        }

        // ==========================================
        // 7. Chat (Central Expandido & Lateral Retrátil)
        // ==========================================
        function toggleChatSidebar(forceState = null) {
            isChatOpen = (forceState !== null) ? forceState : !isChatOpen;
            if (isChatOpen) {
                if (chatSidebar) chatSidebar.classList.add('open');
                if (btnToggleChat) btnToggleChat.classList.add('btn-active-highlight');
                if (chatUnreadDot) chatUnreadDot.style.display = 'none';
                unreadCount = 0;
                if (chatInput) setTimeout(() => chatInput.focus(), 150);
            } else {
                if (chatSidebar) chatSidebar.classList.remove('open');
                if (btnToggleChat) btnToggleChat.classList.remove('btn-active-highlight');
            }
        }

        if (btnToggleChat) btnToggleChat.addEventListener('click', () => toggleChatSidebar());
        if (btnCloseChat) btnCloseChat.addEventListener('click', () => toggleChatSidebar(false));

        function formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        function formatBytes(bytes, decimals = 1) {
            if (!+bytes) return '0 B';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
        }

        async function uploadChatMedia(file, base64) {
            if (!authToken) throw new Error('Não autenticado para upload');
            const res = await fetch('/upload/media', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: base64
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Falha ao fazer upload da imagem.');
            }

            const data = await res.json();
            return data.url;
        }

        function clearMainChatMediaPreview() {
            pendingMainChatMedia = null;
            if (inputAttachMainChat) inputAttachMainChat.value = '';
            if (mainChatMediaPreview) mainChatMediaPreview.classList.add('hidden');
            if (mainChatMediaPreviewImg) mainChatMediaPreviewImg.src = '';
        }

        function clearDmMediaPreview() {
            pendingDmMedia = null;
            if (inputAttachDm) inputAttachDm.value = '';
            if (dmMediaPreview) dmMediaPreview.classList.add('hidden');
            if (dmMediaPreviewImg) dmMediaPreviewImg.src = '';
        }

        function clearSideMediaPreview() {
            pendingSideMedia = null;
            if (inputAttachSide) inputAttachSide.value = '';
            if (sideMediaPreview) sideMediaPreview.classList.add('hidden');
            if (sideMediaPreviewImg) sideMediaPreviewImg.src = '';
        }

        // Setup Anexos de Mídia no Chat Central (Canal - Sprint 4)
        if (btnAttachMainChat && inputAttachMainChat) {
            btnAttachMainChat.addEventListener('click', () => {
                inputAttachMainChat.click();
            });

            inputAttachMainChat.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, GIF, WebP).');
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    alert('A imagem selecionada excede o limite máximo de 10 MB.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (re) => {
                    const base64 = re.target.result;
                    pendingMainChatMedia = { file, base64, name: file.name, size: file.size };
                    if (mainChatMediaPreviewImg) mainChatMediaPreviewImg.src = base64;
                    if (mainChatMediaPreviewName) mainChatMediaPreviewName.textContent = file.name;
                    if (mainChatMediaPreviewSize) mainChatMediaPreviewSize.textContent = formatBytes(file.size);
                    if (mainChatMediaPreview) mainChatMediaPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveMainChatMedia) {
            btnRemoveMainChatMedia.addEventListener('click', clearMainChatMediaPreview);
        }

        // Setup Anexos de Mídia no Chat de DMs (Sprint 4)
        if (btnAttachDm && inputAttachDm) {
            btnAttachDm.addEventListener('click', () => {
                inputAttachDm.click();
            });

            inputAttachDm.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, GIF, WebP).');
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    alert('A imagem selecionada excede o limite máximo de 10 MB.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (re) => {
                    const base64 = re.target.result;
                    pendingDmMedia = { file, base64, name: file.name, size: file.size };
                    if (dmMediaPreviewImg) dmMediaPreviewImg.src = base64;
                    if (dmMediaPreviewName) dmMediaPreviewName.textContent = file.name;
                    if (dmMediaPreviewSize) dmMediaPreviewSize.textContent = formatBytes(file.size);
                    if (dmMediaPreview) dmMediaPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveDmMedia) {
            btnRemoveDmMedia.addEventListener('click', clearDmMediaPreview);
        }

        // Setup Anexos de Mídia no Chat Lateral da Chamada (Sprint 4)
        if (btnAttachSide && inputAttachSide) {
            btnAttachSide.addEventListener('click', () => {
                inputAttachSide.click();
            });

            inputAttachSide.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, GIF, WebP).');
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    alert('A imagem selecionada excede o limite máximo de 10 MB.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (re) => {
                    const base64 = re.target.result;
                    pendingSideMedia = { file, base64, name: file.name, size: file.size };
                    if (sideMediaPreviewImg) sideMediaPreviewImg.src = base64;
                    if (sideMediaPreviewName) sideMediaPreviewName.textContent = file.name;
                    if (sideMediaPreviewSize) sideMediaPreviewSize.textContent = formatBytes(file.size);
                    if (sideMediaPreview) sideMediaPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveSideMedia) {
            btnRemoveSideMedia.addEventListener('click', clearSideMediaPreview);
        }

        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // ==========================================
        // Epic Sprint: Sistema de Menções (@) com Glassmorphism
        // ==========================================
        function formatMessageTextWithMentions(text) {
            if (!text) return '';
            const safeText = escapeHtml(text);
            return safeText.replace(/@([a-zA-Z0-9_\-\.]+)/g, (match, mentionedName) => {
                const myUsername = currentUser?.username || '';
                const myDisplayName = currentUser?.display_name || '';
                const isSelfMention = (
                    mentionedName.toLowerCase() === myUsername.toLowerCase() ||
                    (myDisplayName && mentionedName.toLowerCase() === myDisplayName.toLowerCase()) ||
                    mentionedName.toLowerCase() === 'everyone'
                );
                return `<span class="mention ${isSelfMention ? 'mention-self' : ''}">@${mentionedName}</span>`;
            });
        }

        // ==========================================
        // Sprint 7 & Epic Sprint: Gestão e Moderação de Mensagens (CRUD & Admin Actions)
        // ==========================================
        function createChatMessageGroup({ id, text, media_url, sender, timestamp, isMine, is_edited }) {
            const group = document.createElement('div');
            group.className = `message-group ${isMine ? 'mine' : 'other'}`;
            if (id) {
                group.id = `msg-group-${id}`;
                group.setAttribute('data-msg-id', String(id));
            } else {
                group.id = `msg-group-temp-${timestamp}`;
                group.setAttribute('data-msg-id', `temp-${timestamp}`);
            }

            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-meta';

            const strong = document.createElement('strong');
            strong.textContent = isMine ? (currentAuthUser ? `${currentAuthUser} (Você)` : 'Você') : (sender || 'Participante');

            const timeSpan = document.createElement('span');
            timeSpan.textContent = formatTime(timestamp);

            metaDiv.appendChild(strong);
            metaDiv.appendChild(timeSpan);

            if (is_edited) {
                const editedSpan = document.createElement('span');
                editedSpan.className = 'message-edited-badge';
                editedSpan.textContent = '(editado)';
                metaDiv.appendChild(editedSpan);
            }

            group.appendChild(metaDiv);

            let bubbleDiv = null;
            if (text) {
                bubbleDiv = document.createElement('div');
                bubbleDiv.className = 'message-bubble';
                bubbleDiv.innerHTML = formatMessageTextWithMentions(text);
                bubbleDiv.setAttribute('data-bubble-text', text);
                group.appendChild(bubbleDiv);
            }

            if (media_url) {
                const imgWrap = document.createElement('div');
                imgWrap.className = 'chat-message-image-wrapper';
                const img = document.createElement('img');
                img.className = 'chat-message-image';
                img.src = media_url;
                img.alt = 'Imagem anexada';
                img.loading = 'lazy';
                img.title = 'Clique para ver em tamanho real';
                img.addEventListener('click', () => {
                    window.open(media_url, '_blank');
                });
                imgWrap.appendChild(img);
                group.appendChild(imgWrap);
            }

            // Barra de Ações Flutuante (Editar & Apagar com verificação de Admin / Moderador / Dono)
            const isOwner = Boolean(activeServerObj && currentUser && Number(activeServerObj.dono_id) === Number(currentUser.id));
            const currentMemberObj = (currentServerMembersList || []).find(m => Number(m.user_id) === Number(currentUser?.id));
            const currentMemberRoles = Array.isArray(currentMemberObj?.roles) ? currentMemberObj.roles : [];
            const isAdmin = currentMemberRoles.some(r => {
                const name = (r.nome || '').toLowerCase();
                return name === 'admin' || name === 'administrador' || name === 'moderador' ||
                       r.permissoes?.can_delete_messages || r.permissoes?.can_manage_server;
            });
            const canDelete = isMine || isOwner || isAdmin;

            if (isMine || canDelete) {
                const actionsBar = document.createElement('div');
                actionsBar.className = 'message-actions-bar';

                // Botão Editar (Apenas mensagens de texto próprias)
                if (isMine && text) {
                    const btnEdit = document.createElement('button');
                    btnEdit.type = 'button';
                    btnEdit.className = 'btn-message-action btn-edit-msg';
                    btnEdit.title = 'Editar mensagem';
                    btnEdit.innerHTML = `
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    `;
                    btnEdit.addEventListener('click', (e) => {
                        e.stopPropagation();
                        startEditMessage(group, id, bubbleDiv);
                    });
                    actionsBar.appendChild(btnEdit);
                }

                // Botão Apagar (Próprias mensagens ou Moderador/Dono)
                if (canDelete) {
                    const btnDelete = document.createElement('button');
                    btnDelete.type = 'button';
                    btnDelete.className = 'btn-message-action btn-delete-msg';
                    btnDelete.title = 'Apagar mensagem';
                    btnDelete.innerHTML = `
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    `;
                    btnDelete.addEventListener('click', (e) => {
                        e.stopPropagation();
                        confirmDeleteMessage(group, id);
                    });
                    actionsBar.appendChild(btnDelete);
                }

                group.appendChild(actionsBar);
            }

            return group;
        }

        function startEditMessage(group, msgId, bubbleDiv) {
            if (!bubbleDiv) return;
            const originalText = bubbleDiv.getAttribute('data-bubble-text') || bubbleDiv.textContent || '';

            // Se já estiver em modo de edição, foca no input existente
            const existingInput = group.querySelector('.message-edit-input');
            if (existingInput) {
                existingInput.focus();
                return;
            }

            const editBox = document.createElement('div');
            editBox.className = 'message-edit-container';

            const textarea = document.createElement('textarea');
            textarea.className = 'message-edit-input';
            textarea.value = originalText;
            textarea.rows = 2;

            const footer = document.createElement('div');
            footer.className = 'message-edit-footer';

            const helpText = document.createElement('span');
            helpText.textContent = 'Enter para salvar • ESC para cancelar';

            const actionsWrap = document.createElement('div');
            actionsWrap.className = 'message-edit-actions';

            const btnCancel = document.createElement('button');
            btnCancel.type = 'button';
            btnCancel.className = 'btn-edit-cancel';
            btnCancel.textContent = 'Cancelar';

            const btnSave = document.createElement('button');
            btnSave.type = 'button';
            btnSave.className = 'btn-edit-save';
            btnSave.textContent = 'Salvar';

            actionsWrap.appendChild(btnCancel);
            actionsWrap.appendChild(btnSave);
            footer.appendChild(helpText);
            footer.appendChild(actionsWrap);
            editBox.appendChild(textarea);
            editBox.appendChild(footer);

            bubbleDiv.style.display = 'none';
            group.appendChild(editBox);
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);

            const cancelEdit = () => {
                editBox.remove();
                bubbleDiv.style.display = 'block';
            };

            const saveEdit = async () => {
                const newText = textarea.value.trim();
                if (!newText) {
                    alert('O texto da mensagem não pode ficar vazio.');
                    return;
                }
                if (newText === originalText) {
                    cancelEdit();
                    return;
                }

                btnSave.disabled = true;
                btnSave.textContent = 'Salvando...';

                await submitEditMessage(msgId, newText, group, bubbleDiv);
                editBox.remove();
                bubbleDiv.textContent = newText;
                bubbleDiv.setAttribute('data-bubble-text', newText);
                bubbleDiv.style.display = 'block';

                const meta = group.querySelector('.message-meta');
                if (meta && !meta.querySelector('.message-edited-badge')) {
                    const b = document.createElement('span');
                    b.className = 'message-edited-badge';
                    b.textContent = '(editado)';
                    meta.appendChild(b);
                }
            };

            btnCancel.addEventListener('click', cancelEdit);
            btnSave.addEventListener('click', saveEdit);

            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                }
            });
        }

        async function submitEditMessage(msgId, newText, group, bubbleDiv) {
            const actualId = group.getAttribute('data-msg-id') || msgId;
            if (!actualId || actualId.startsWith('temp-')) {
                // Fallback socket direto
                if (socket.connected) {
                    socket.emit('edit-message', { id: actualId, text: newText, room: currentRoom });
                }
                return;
            }

            try {
                // Envia via REST API protegida
                const res = await fetch(`/messages/${actualId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ text: newText })
                });

                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || 'Erro ao editar mensagem.');
                    return;
                }

                // Emite também via Socket.IO para confirmação imediata
                if (socket.connected) {
                    socket.emit('edit-message', { id: actualId, text: newText, room: currentRoom });
                }
            } catch (err) {
                console.error('Erro na requisição de edição:', err);
                alert('Erro de conexão ao editar mensagem.');
            }
        }

        async function confirmDeleteMessage(group, msgId) {
            const actualId = group.getAttribute('data-msg-id') || msgId;
            if (!confirm('Deseja realmente apagar esta mensagem permanentemente?')) {
                return;
            }

            group.style.opacity = '0';
            group.style.transform = 'scale(0.95)';
            group.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

            try {
                if (actualId && !actualId.startsWith('temp-')) {
                    const res = await fetch(`/api/messages/${actualId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        alert(data.error || 'Erro ao apagar mensagem.');
                        group.style.opacity = '1';
                        group.style.transform = 'scale(1)';
                        return;
                    }
                }

                if (socket.connected) {
                    socket.emit('delete-message', { id: actualId, room: currentRoom });
                }

                setTimeout(() => group.remove(), 200);
            } catch (err) {
                console.error('Erro ao apagar mensagem:', err);
                group.style.opacity = '1';
                group.style.transform = 'scale(1)';
            }
        }

        function appendChatMessage({ id, text, media_url, sender, timestamp, isMine, is_edited }) {
            if (mainChatMessagesList) {
                const groupMain = createChatMessageGroup({ id, text, media_url, sender, timestamp, isMine, is_edited });
                mainChatMessagesList.appendChild(groupMain);
                mainChatMessagesList.scrollTop = mainChatMessagesList.scrollHeight;
            }

            if (chatMessages) {
                const groupSide = createChatMessageGroup({ id, text, media_url, sender, timestamp, isMine, is_edited });
                chatMessages.appendChild(groupSide);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        async function sendChatMessage(text, targetType = 'main') {
            const cleanText = (text || '').trim();
            const hasMedia = targetType === 'main' ? Boolean(pendingMainChatMedia) : Boolean(pendingSideMedia);
            if (!cleanText && !hasMedia) return;
            if (!currentRoom) return;

            let uploadedMediaUrl = null;
            if (hasMedia) {
                const pendingObj = targetType === 'main' ? pendingMainChatMedia : pendingSideMedia;
                try {
                    uploadedMediaUrl = await uploadChatMedia(pendingObj.file, pendingObj.base64);
                } catch (upErr) {
                    console.error('Erro no upload de mídia de chat:', upErr);
                    alert('Erro ao enviar imagem: ' + (upErr.message || 'Falha no upload'));
                    return;
                }

                if (targetType === 'main') {
                    clearMainChatMediaPreview();
                    stopInputTyping(currentRoom, 'channel');
                } else {
                    clearSideMediaPreview();
                    stopInputTyping(currentVoiceRoom || currentRoom, 'side');
                }
            } else {
                if (targetType === 'main') stopInputTyping(currentRoom, 'channel');
                else stopInputTyping(currentVoiceRoom || currentRoom, 'side');
            }

            const myUsername = currentUser?.username || 'Você';
            const timestamp = Date.now();
            const tempId = `temp-${timestamp}`;
            const messageData = {
                tempId: tempId,
                room: currentRoom,
                text: cleanText,
                media_url: uploadedMediaUrl,
                sender: myUsername,
                timestamp: timestamp
            };

            // Renderiza imediatamente na UI do remetente
            appendChatMessage({
                id: tempId,
                text: cleanText,
                media_url: uploadedMediaUrl,
                sender: myUsername,
                timestamp: timestamp,
                isMine: true,
                is_edited: false
            });

            if (mainChatExpandedInput) mainChatExpandedInput.value = '';
            if (chatInput) chatInput.value = '';

            // Se o socket estiver conectado, envia diretamente; caso contrário, enfileira (Message Queue)
            if (socket.connected) {
                socket.emit('chat-message', messageData);
                console.log('💬 [Chat] Mensagem enviada em tempo real:', messageData);
            } else {
                pendingMessageQueue.push(messageData);
                console.warn('⚠️ [Message Queue] Socket offline/desconectado. Mensagem guardada na fila de envio automático:', messageData);
            }
        }

        // ==========================================
        // Epic Sprint: Indicadores de Digitação (Typing Indicators)
        // ==========================================
        function getActiveDmRoomName() {
            if (privateCallRoom) return privateCallRoom;
            if (activeDmUserId && currentUser) {
                const u1 = Math.min(Number(currentUser.id), Number(activeDmUserId));
                const u2 = Math.max(Number(currentUser.id), Number(activeDmUserId));
                return `dm_${u1}_${u2}`;
            }
            return null;
        }

        function handleInputTyping(room, type = 'channel') {
            if (!socket.connected || !room) return;

            if (type === 'channel') {
                if (!isMainChatTyping) {
                    isMainChatTyping = true;
                    socket.emit('typing', { room: room, isTyping: true });
                }
                clearTimeout(mainChatTypingTimer);
                mainChatTypingTimer = setTimeout(() => {
                    isMainChatTyping = false;
                    socket.emit('typing', { room: room, isTyping: false });
                }, 2500);
            } else if (type === 'side') {
                if (!isSideChatTyping) {
                    isSideChatTyping = true;
                    socket.emit('typing', { room: room, isTyping: true });
                }
                clearTimeout(sideChatTypingTimer);
                sideChatTypingTimer = setTimeout(() => {
                    isSideChatTyping = false;
                    socket.emit('typing', { room: room, isTyping: false });
                }, 2500);
            } else if (type === 'dm') {
                if (!isDmTyping) {
                    isDmTyping = true;
                    socket.emit('typing', { room: room, isTyping: true });
                }
                clearTimeout(dmTypingTimer);
                dmTypingTimer = setTimeout(() => {
                    isDmTyping = false;
                    socket.emit('typing', { room: room, isTyping: false });
                }, 2500);
            }
        }

        function stopInputTyping(room, type = 'channel') {
            if (!socket.connected || !room) return;
            if (type === 'channel') {
                clearTimeout(mainChatTypingTimer);
                if (isMainChatTyping) {
                    isMainChatTyping = false;
                    socket.emit('typing', { room: room, isTyping: false });
                }
            } else if (type === 'side') {
                clearTimeout(sideChatTypingTimer);
                if (isSideChatTyping) {
                    isSideChatTyping = false;
                    socket.emit('typing', { room: room, isTyping: false });
                }
            } else if (type === 'dm') {
                clearTimeout(dmTypingTimer);
                if (isDmTyping) {
                    isDmTyping = false;
                    socket.emit('typing', { room: room, isTyping: false });
                }
            }
        }

        function updateTypingIndicatorsUI(room) {
            const roomMap = activeTypingUsersMap.get(room);
            const typingUsers = roomMap ? Array.from(roomMap.values()).map(v => v.name) : [];

            const renderHtml = (names) => {
                if (!names || names.length === 0) return '';
                const dotsHtml = `<span class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>`;
                if (names.length === 1) {
                    return `${dotsHtml} <span><strong>${escapeHtml(names[0])}</strong> está digitando...</span>`;
                } else if (names.length === 2) {
                    return `${dotsHtml} <span><strong>${escapeHtml(names[0])}</strong> e <strong>${escapeHtml(names[1])}</strong> estão digitando...</span>`;
                } else {
                    return `${dotsHtml} <span>Várias pessoas estão digitando...</span>`;
                }
            };

            // 1. Canal de Texto Principal
            if (channelTypingIndicator) {
                if (currentRoom === room && typingUsers.length > 0) {
                    channelTypingIndicator.innerHTML = renderHtml(typingUsers);
                    channelTypingIndicator.classList.remove('hidden');
                } else if (currentRoom === room) {
                    channelTypingIndicator.innerHTML = '';
                    channelTypingIndicator.classList.add('hidden');
                }
            }

            // 2. Chat Lateral da Chamada de Voz
            if (sideChatTypingIndicator) {
                if (currentVoiceRoom === room && typingUsers.length > 0) {
                    sideChatTypingIndicator.innerHTML = renderHtml(typingUsers);
                    sideChatTypingIndicator.classList.remove('hidden');
                } else if (currentVoiceRoom === room) {
                    sideChatTypingIndicator.innerHTML = '';
                    sideChatTypingIndicator.classList.add('hidden');
                }
            }

            // 3. Chat de DM
            if (dmTypingIndicator) {
                const activeDmRoom = getActiveDmRoomName();
                if (activeDmRoom === room && typingUsers.length > 0) {
                    dmTypingIndicator.innerHTML = renderHtml(typingUsers);
                    dmTypingIndicator.classList.remove('hidden');
                } else if (activeDmRoom === room) {
                    dmTypingIndicator.innerHTML = '';
                    dmTypingIndicator.classList.add('hidden');
                }
            }
        }

        // Input listeners para digitação em tempo real
        if (mainChatExpandedInput) {
            mainChatExpandedInput.addEventListener('input', () => {
                if (currentRoom) handleInputTyping(currentRoom, 'channel');
            });
        }

        if (chatInput) {
            chatInput.addEventListener('input', () => {
                const targetRoom = currentVoiceRoom || currentRoom;
                if (targetRoom) handleInputTyping(targetRoom, 'side');
            });
        }

        if (inputDmMessage) {
            inputDmMessage.addEventListener('input', () => {
                const targetRoom = getActiveDmRoomName();
                if (targetRoom) handleInputTyping(targetRoom, 'dm');
            });
        }

        if (mainChatExpandedForm) {
            mainChatExpandedForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (mainChatExpandedInput) sendChatMessage(mainChatExpandedInput.value, 'main');
            });
        }

        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (chatInput) sendChatMessage(chatInput.value, 'side');
            });
        }

        socket.on('chat-message', (data) => {
            console.log('💬 Mensagem recebida no chat:', data);
            const myUsername = currentUser?.username;
            const isMine = Boolean(myUsername && data.sender && data.sender === myUsername);
            appendChatMessage({
                id: data.id,
                text: data.text,
                media_url: data.media_url,
                sender: data.sender || 'Participante',
                timestamp: data.timestamp || Date.now(),
                isMine: isMine,
                is_edited: Boolean(data.is_edited)
            });

            if (!isMine) {
                soundManager.play('message');
            }

            if (currentViewMode === 'voice' && !isChatOpen) {
                unreadCount++;
                chatUnreadDot.style.display = 'block';
            }
        });

        // 🔄 Sprint 7: Sincronização em Tempo Real de Edição de Mensagem
        socket.on('message-updated', (data) => {
            if (!data || !data.id) return;
            console.log('✏️ Mensagem atualizada recebida:', data);
            document.querySelectorAll(`[data-msg-id="${data.id}"]`).forEach(group => {
                const bubble = group.querySelector('.message-bubble');
                if (bubble) {
                    bubble.innerHTML = formatMessageTextWithMentions(data.text);
                    bubble.setAttribute('data-bubble-text', data.text);
                }
                const meta = group.querySelector('.message-meta');
                if (meta && !meta.querySelector('.message-edited-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'message-edited-badge';
                    badge.textContent = '(editado)';
                    meta.appendChild(badge);
                }
            });
        });

        // ✍️ Epic Sprint: Sincronização em Tempo Real de Usuário Digitando
        socket.on('user-typing', (data) => {
            if (!data || !data.room) return;
            if (currentUser && Number(data.userId) === Number(currentUser.id)) return;

            const room = data.room;
            if (!activeTypingUsersMap.has(room)) {
                activeTypingUsersMap.set(room, new Map());
            }

            const roomMap = activeTypingUsersMap.get(room);
            const userKey = data.userId || data.username;

            if (data.isTyping) {
                if (roomMap.has(userKey)) {
                    clearTimeout(roomMap.get(userKey).timeout);
                }
                const timeout = setTimeout(() => {
                    roomMap.delete(userKey);
                    updateTypingIndicatorsUI(room);
                }, 3500);

                roomMap.set(userKey, {
                    name: data.displayName || data.username || 'Usuário',
                    timeout
                });
            } else {
                if (roomMap.has(userKey)) {
                    clearTimeout(roomMap.get(userKey).timeout);
                    roomMap.delete(userKey);
                }
            }

            updateTypingIndicatorsUI(room);
        });

        // 🗑️ Sprint 7 & Epic Sprint: Sincronização em Tempo Real de Exclusão de Mensagem
        socket.on('message-deleted', (data) => {
            if (!data || !data.id) return;
            console.log('🗑️ Mensagem deletada recebida:', data);
            document.querySelectorAll(`[data-msg-id="${data.id}"]`).forEach(group => {
                group.style.opacity = '0';
                group.style.transform = 'scale(0.95)';
                group.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
                setTimeout(() => group.remove(), 200);
            });
        });

        // Confirmação do ID persistido do Banco para o Remetente
        socket.on('chat-message-sent', (data) => {
            if (data && data.tempId && data.id) {
                const tempGroup = document.getElementById(`msg-group-temp-${data.tempId}`) || document.querySelector(`[data-msg-id="${data.tempId}"]`);
                if (tempGroup) {
                    tempGroup.id = `msg-group-${data.id}`;
                    tempGroup.setAttribute('data-msg-id', String(data.id));
                }
            }
        });

        socket.on('room-history', (data) => {
            console.log(`📜 Histórico carregado do Supabase para [${data.room}]:`, data.messages);

            if (mainChatMessagesList) {
                mainChatMessagesList.textContent = '';
                const bannerDiv = document.createElement('div');
                bannerDiv.className = 'channel-welcome-banner';

                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'channel-welcome-avatar';
                avatarDiv.textContent = '#';

                const h2 = document.createElement('h2');
                const channelName = currentActiveChannelObj ? currentActiveChannelObj.nome : 'canal';
                h2.textContent = `Bem-vindo ao #${channelName}!`;

                const p = document.createElement('p');
                p.textContent = 'Histórico sincronizado do Supabase PostgreSQL.';

                bannerDiv.appendChild(avatarDiv);
                bannerDiv.appendChild(h2);
                bannerDiv.appendChild(p);
                mainChatMessagesList.appendChild(bannerDiv);
            }

            if (chatMessages) {
                chatMessages.textContent = '';
                const noticeDiv = document.createElement('div');
                noticeDiv.className = 'chat-system-notice';
                noticeDiv.innerHTML = `
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Histórico sincronizado com PostgreSQL.</span>
                `;
                chatMessages.appendChild(noticeDiv);
            }

            if (Array.isArray(data.messages)) {
                data.messages.forEach((msg) => {
                    const isMine = Boolean(currentAuthUser && msg.sender && msg.sender === currentAuthUser);
                    appendChatMessage({
                        id: msg.id,
                        text: msg.text,
                        media_url: msg.media_url,
                        sender: msg.sender || 'Participante',
                        timestamp: new Date(msg.timestamp).getTime(),
                        isMine: isMine,
                        is_edited: Boolean(msg.is_edited)
                    });
                });
            }
        });

        // ==========================================
        // 8. Web Audio API & GainNode Engine (Sprint 5)
        // ==========================================
        let globalAudioContext = null;
        const peerAudioNodes = {}; // { [peerId]: { sourceNode, gainNode, stream } }
        const peerVolumeSettings = {}; // { [peerId]: number }
        let localMicAudioContext = null;
        let localMicSource = null;
        let localMicGainNode = null;
        let localMicDestination = null;
        let userMicGainPreference = parseFloat(localStorage.getItem('nexuscomm_mic_gain') || '1.0');

        function getOrCreateAudioContext() {
            if (!globalAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    globalAudioContext = new AudioContextClass();
                }
            }
            if (globalAudioContext && globalAudioContext.state === 'suspended') {
                globalAudioContext.resume().catch(e => console.warn('AudioContext resume aguardando gesto:', e));
            }
            return globalAudioContext;
        }

        function setupRemotePeerAudioGain(peerId, stream) {
            if (!stream) return;
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) return;

            try {
                const ctx = getOrCreateAudioContext();
                if (!ctx) return;

                if (peerAudioNodes[peerId]) {
                    try {
                        peerAudioNodes[peerId].sourceNode.disconnect();
                        peerAudioNodes[peerId].gainNode.disconnect();
                    } catch(e) {}
                }

                const sourceNode = ctx.createMediaStreamSource(stream);
                const gainNode = ctx.createGain();
                const currentGain = peerVolumeSettings[peerId] ?? 1.0;
                gainNode.gain.value = currentGain;

                sourceNode.connect(gainNode);
                gainNode.connect(ctx.destination);

                peerAudioNodes[peerId] = { sourceNode, gainNode, stream };

                // Muta o elemento <video> HTML correspondente para não haver reprodução duplicada
                const videoEl = document.getElementById(`video-${peerId}`) || (peerId === 'dm-remote' ? dmRemoteVideo : null);
                if (videoEl) {
                    videoEl.muted = true;
                }
                console.log(`🔊 [Web Audio API] GainNode configurado com sucesso para o peer [${peerId}] com ganho ${currentGain}`);
            } catch(audioErr) {
                console.warn(`Aviso ao configurar GainNode para peer [${peerId}]:`, audioErr);
            }
        }

        function setPeerVolume(peerId, volumeVal) {
            const val = Math.max(0, Math.min(2, Number(volumeVal)));
            peerVolumeSettings[peerId] = val;

            if (peerAudioNodes[peerId]?.gainNode) {
                peerAudioNodes[peerId].gainNode.gain.value = val;
            }

            // Atualiza o texto de porcentagem correspondente
            const percentLabel = document.getElementById(`vol-percent-${peerId}`) || (peerId === 'dm-remote' ? document.getElementById('dmRemoteVolumePercent') : null);
            if (percentLabel) {
                percentLabel.textContent = `${Math.round(val * 100)}%`;
            }
        }

        function setLocalMicSensitivity(gainVal) {
            const val = Math.max(0, Math.min(2, Number(gainVal)));
            userMicGainPreference = val;
            localStorage.setItem('nexuscomm_mic_gain', val.toString());

            if (localMicGainNode) {
                localMicGainNode.gain.value = val;
            }

            if (labelMicSensitivity) {
                labelMicSensitivity.textContent = `${Math.round(val * 100)}%`;
            }
        }

        // ==========================================
        // SoundManager: Gerenciador de Efeitos Sonoros & Feedback Auditivo (Sprint de UI/UX)
        // ==========================================
        class SoundManager {
            constructor() {
                this.enabled = localStorage.getItem('nexuscomm_sound_effects_enabled') !== 'false';
                this.volume = parseFloat(localStorage.getItem('nexuscomm_sound_volume') || '0.7');
            }

            setEnabled(val) {
                this.enabled = Boolean(val);
                localStorage.setItem('nexuscomm_sound_effects_enabled', this.enabled ? 'true' : 'false');
                console.log(`🔊 [SoundManager] Efeitos sonoros ${this.enabled ? 'ativados' : 'desativados'}`);
            }

            setVolume(val) {
                this.volume = Math.max(0, Math.min(1, parseFloat(val)));
                localStorage.setItem('nexuscomm_sound_volume', this.volume.toString());
            }

            play(type) {
                if (!this.enabled || this.volume <= 0) return;
                try {
                    const ctx = getOrCreateAudioContext();
                    if (!ctx) return;

                    if (ctx.state === 'suspended') {
                        ctx.resume().then(() => this._synthesize(type, ctx)).catch(() => {});
                    } else {
                        this._synthesize(type, ctx);
                    }
                } catch (e) {
                    console.warn(`Aviso ao disparar som [${type}]:`, e);
                }
            }

            _synthesize(type, ctx) {
                try {
                    const now = ctx.currentTime;
                    const masterGain = ctx.createGain();
                    masterGain.gain.setValueAtTime(this.volume, now);
                    masterGain.connect(ctx.destination);

                    switch (type) {
                        case 'join':
                            // 🔊 Som de Entrada (Acorde harmônico duplo ascendente: 440Hz -> 880Hz)
                            this._playTone(ctx, masterGain, 440, now, 0.12, 'sine', 0.35);
                            this._playTone(ctx, masterGain, 880, now + 0.08, 0.18, 'sine', 0.4);
                            break;

                        case 'leave':
                            // 🚪 Som de Saída (Acorde harmônico duplo descendente: 660Hz -> 330Hz)
                            this._playTone(ctx, masterGain, 660, now, 0.12, 'sine', 0.35);
                            this._playTone(ctx, masterGain, 330, now + 0.08, 0.18, 'sine', 0.3);
                            break;

                        case 'message':
                            // 💬 Som de Mensagem (Chime cristalino de sino C6 + E6)
                            this._playBell(ctx, masterGain, 1046.5, now, 0.12, 0.3);
                            this._playBell(ctx, masterGain, 1318.5, now + 0.06, 0.22, 0.35);
                            break;

                        case 'mute':
                            // 🔇 Som de Microfone Mutado (Bi-tonal rápido descendente)
                            this._playTone(ctx, masterGain, 420, now, 0.05, 'triangle', 0.3);
                            this._playTone(ctx, masterGain, 260, now + 0.05, 0.07, 'triangle', 0.3);
                            break;

                        case 'unmute':
                            // 🎙️ Som de Microfone Desmutado (Bi-tonal rápido ascendente)
                            this._playTone(ctx, masterGain, 260, now, 0.05, 'triangle', 0.3);
                            this._playTone(ctx, masterGain, 480, now + 0.05, 0.08, 'triangle', 0.3);
                            break;

                        case 'call_ring':
                            // 📞 Toque de Chamada Recebida (Acorde duplo harmônico)
                            this._playBell(ctx, masterGain, 853, now, 0.15, 0.25);
                            this._playBell(ctx, masterGain, 960, now + 0.05, 0.2, 0.25);
                            break;

                        default:
                            break;
                    }
                } catch (err) {
                    console.warn('Aviso ao sintetizar efeito sonoro:', err);
                }
            }

            _playTone(ctx, masterGain, freq, startTime, duration, type = 'sine', gainLevel = 0.3) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.0001, startTime);
                gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

                osc.connect(gain);
                gain.connect(masterGain);

                osc.start(startTime);
                osc.stop(startTime + duration + 0.05);
            }

            _playBell(ctx, masterGain, freq, startTime, duration, gainLevel = 0.3) {
                const osc = ctx.createOscillator();
                const overtone = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                overtone.type = 'sine';
                overtone.frequency.setValueAtTime(freq * 2.756, startTime);

                gain.gain.setValueAtTime(0.0001, startTime);
                gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.008);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

                osc.connect(gain);
                overtone.connect(gain);
                gain.connect(masterGain);

                osc.start(startTime);
                overtone.start(startTime);
                osc.stop(startTime + duration + 0.05);
                overtone.stop(startTime + duration + 0.05);
            }
        }

        const soundManager = new SoundManager();

        // Listener global para inputs de volume de peers
        document.addEventListener('input', (e) => {
            if (e.target && e.target.classList.contains('peer-volume-slider')) {
                const peerId = e.target.getAttribute('data-peer-id');
                if (peerId) {
                    setPeerVolume(peerId, e.target.value);
                }
            }
        });

        // Configurações e Seletor de Tela Compartilhada (Sprint 5)
        let selectedScreenRes = 720;
        let selectedScreenFps = 30;

        function openScreenShareSettingsModal() {
            if (modalScreenShareSettings) {
                modalScreenShareSettings.style.display = 'flex';
            }
        }

        function closeScreenShareSettingsModal() {
            if (modalScreenShareSettings) {
                modalScreenShareSettings.style.display = 'none';
            }
        }

        if (optRes720) {
            optRes720.addEventListener('click', () => {
                selectedScreenRes = 720;
                optRes720.classList.add('selected');
                if (optRes1080) optRes1080.classList.remove('selected');
            });
        }
        if (optRes1080) {
            optRes1080.addEventListener('click', () => {
                selectedScreenRes = 1080;
                optRes1080.classList.add('selected');
                if (optRes720) optRes720.classList.remove('selected');
            });
        }

        const screenFpsCards = [optFps15, optFps30, optFps60];
        screenFpsCards.forEach(card => {
            if (card) {
                card.addEventListener('click', () => {
                    screenFpsCards.forEach(c => c?.classList.remove('selected'));
                    card.classList.add('selected');
                    selectedScreenFps = Number(card.getAttribute('data-fps') || '30');
                });
            }
        });

        if (btnCloseScreenModal) btnCloseScreenModal.addEventListener('click', closeScreenShareSettingsModal);
        if (btnCancelScreenModal) btnCancelScreenModal.addEventListener('click', closeScreenShareSettingsModal);

        if (formScreenShareSettings) {
            formScreenShareSettings.addEventListener('submit', (e) => {
                e.preventDefault();
                closeScreenShareSettingsModal();
                const shareAudio = Boolean(checkScreenAudio?.checked);
                startScreenShareWithOptions(selectedScreenRes, selectedScreenFps, shareAudio);
            });
        }

        function toggleElementFullscreen(element) {
            if (!element) return;
            try {
                const isFullscreen = document.fullscreenElement || 
                                     document.webkitFullscreenElement || 
                                     document.mozFullScreenElement || 
                                     document.msFullscreenElement;
                if (isFullscreen) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                } else {
                    if (element.requestFullscreen) {
                        element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) {
                        element.webkitRequestFullscreen();
                    } else if (element.mozRequestFullScreen) {
                        element.mozRequestFullScreen();
                    } else if (element.msRequestFullscreen) {
                        element.msRequestFullscreen();
                    }
                }
            } catch (err) {
                console.warn('Não foi possível alternar tela cheia:', err);
            }
        }

        // Listener global para duplo clique em vídeos e wrappers de vídeo
        document.addEventListener('dblclick', (e) => {
            const videoTarget = e.target.closest('video');
            if (videoTarget) {
                toggleElementFullscreen(videoTarget);
                return;
            }
            const wrapperTarget = e.target.closest('.card-video-wrapper, .video-wrapper');
            if (wrapperTarget) {
                const innerVideo = wrapperTarget.querySelector('video');
                if (innerVideo) {
                    toggleElementFullscreen(innerVideo);
                }
            }
        });

        function getOrCreateRemoteCard(socketId, username) {
            let card = document.getElementById(`card-${socketId}`);
            if (card) return card;

            const displayUsername = username || peerUsernames[socketId] || `Participante (${socketId.substring(0, 5)})`;
            peerUsernames[socketId] = displayUsername;

            card = document.createElement('div');
            card.className = 'video-card';
            card.id = `card-${socketId}`;
            card.innerHTML = `
                <div class="video-card-header">
                    <span class="video-card-title">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span id="name-${socketId}"></span>
                    </span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="peer-volume-control" title="Volume individual deste usuário">
                            <svg class="peer-volume-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                            </svg>
                            <input type="range" min="0" max="2" step="0.05" value="1" class="nexus-range-slider peer-volume-slider" data-peer-id="${socketId}" />
                            <span class="peer-volume-percent" id="vol-percent-${socketId}">100%</span>
                        </div>
                        <span id="status-${socketId}" class="badge-status badge-connecting">
                            <span class="spinner-small"></span> Conectando...
                        </span>
                    </div>
                </div>
                <div class="video-wrapper" title="Clique duplo para alternar Tela Cheia">
                    <div class="fullscreen-hint-badge">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>Duplo clique: Tela cheia</span>
                    </div>
                    <div id="placeholder-${socketId}" class="video-placeholder">
                        <div class="spinner-pulse" id="spinner-${socketId}"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span id="placeholderText-${socketId}">Conectando áudio/vídeo...</span>
                    </div>
                    <video id="video-${socketId}" autoplay playsinline></video>
                    <div class="floating-media-badges">
                        <span class="floating-badge active-green" id="floatMic-${socketId}" title="Microfone Ativo">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </span>
                        <span class="floating-badge" id="floatCam-${socketId}" title="Câmera Desligada">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </span>
                    </div>
                </div>
            `;

            const nameEl = card.querySelector(`#name-${socketId}`);
            if (nameEl) nameEl.textContent = displayUsername;

            videoGrid.appendChild(card);

            const videoEl = card.querySelector(`#video-${socketId}`);
            if (!remoteStreams[socketId]) remoteStreams[socketId] = new MediaStream();
            videoEl.srcObject = remoteStreams[socketId];

            updateGridLayout();
            return card;
        }

        // ==========================================
        // 9. WebRTC Multi-Peer (RTCPeerConnection) & NAT Traversal
        // ==========================================
        function createPeerConnection(targetSocketId, isInitiator, targetUsername) {
            if (peerConnections[targetSocketId]) return peerConnections[targetSocketId];

            console.log(`🌐 Criando RTCPeerConnection para [${targetSocketId}] | Initiator: ${isInitiator}`);
            const pc = new RTCPeerConnection(rtcConfiguration);
            peerConnections[targetSocketId] = pc;
            iceCandidateQueues[targetSocketId] = [];

            getOrCreateRemoteCard(targetSocketId, targetUsername);

            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });

            pc.onicecandidate = (event) => {
                const targetRoom = isPrivateCallActive ? privateCallRoom : currentVoiceRoom;
                if (event.candidate && targetRoom) {
                    socket.emit('ice-candidate', {
                        target: targetSocketId,
                        room: targetRoom,
                        candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate
                    });
                }
            };

            pc.ontrack = (event) => {
                console.log(`🎥 Recebida track remota de [${targetSocketId}]:`, event.track.kind);
                if (!remoteStreams[targetSocketId]) remoteStreams[targetSocketId] = new MediaStream();
                const stream = remoteStreams[targetSocketId];

                stream.getTracks().forEach((t) => {
                    if (t.kind === event.track.kind && t.id !== event.track.id) stream.removeTrack(t);
                });
                stream.addTrack(event.track);

                // Configura GainNode para controle de volume individual do peer
                if (event.track.kind === 'audio') {
                    setupRemotePeerAudioGain(targetSocketId, stream);
                }

                // Se estiver em Chamada Privada DM
                if (isPrivateCallActive) {
                    if (dmRemoteVideo && dmRemoteVideo.srcObject !== stream) {
                        dmRemoteVideo.srcObject = stream;
                    }
                    if (event.track.kind === 'audio') {
                        setupRemotePeerAudioGain('dm-remote', stream);
                    }
                    if (event.track.kind === 'video') {
                        if (dmRemotePlaceholder) dmRemotePlaceholder.style.opacity = '0';
                    }
                    if (dmCallStatusBadge) {
                        dmCallStatusBadge.textContent = 'Conectado (Ao Vivo)';
                    }
                    if (dmRemoteVideo) {
                        dmRemoteVideo.play().catch(e => console.warn('Autoplay DM aguardando interação:', e));
                    }
                }

                const videoEl = document.getElementById(`video-${targetSocketId}`);
                if (videoEl && videoEl.srcObject !== stream) videoEl.srcObject = stream;

                const placeholder = document.getElementById(`placeholder-${targetSocketId}`);
                const floatCam = document.getElementById(`floatCam-${targetSocketId}`);
                if (event.track.kind === 'video') {
                    if (placeholder) placeholder.style.opacity = '0';
                    if (floatCam) {
                        floatCam.classList.add('active-green');
                        floatCam.classList.remove('active-danger');
                        floatCam.title = 'Câmera Ativa';
                    }
                }

                if (videoEl) {
                    videoEl.play().catch(e => console.warn('Autoplay aguardando interação:', e));
                }
            };

            // Monitoramento de auditoria e Keep-Alive / ICE Restart
            pc.oniceconnectionstatechange = () => {
                const iceState = pc.iceConnectionState;
                console.log(`🔄 [WebRTC ICE State Change] Peer [${targetSocketId}]: ${iceState}`);
                const statusBadge = document.getElementById(`status-${targetSocketId}`);
                const spinner = document.getElementById(`spinner-${targetSocketId}`);
                const placeholderText = document.getElementById(`placeholderText-${targetSocketId}`);

                if (iceState === 'connected' || iceState === 'completed') {
                    console.log(`✅ [WebRTC Conectado] Malha P2P restabelecida com sucesso com o peer [${targetSocketId}]`);
                    if (isPrivateCallActive && dmCallStatusBadge) {
                        dmCallStatusBadge.textContent = 'Conectado';
                    }
                    if (statusBadge) {
                        statusBadge.className = 'badge-status badge-live';
                        statusBadge.innerText = 'Ao Vivo';
                    }
                    if (spinner) spinner.style.display = 'none';
                    if (placeholderText) placeholderText.innerText = 'Câmera desligada';
                    updateGridLayout();
                } else if (iceState === 'checking') {
                    console.log(`⏳ [WebRTC Verificando] Negociando candidatos ICE com o peer [${targetSocketId}]...`);
                    if (statusBadge) {
                        statusBadge.className = 'badge-status badge-connecting';
                        statusBadge.innerHTML = '<span class="spinner-small"></span> Conectando...';
                    }
                    if (spinner) spinner.style.display = 'block';
                    if (placeholderText) placeholderText.innerText = 'Negociando P2P...';
                } else if (iceState === 'disconnected' || iceState === 'failed') {
                    console.warn(`⚠️ [WebRTC Queda/Oscilação] ICE state '${iceState}' detectado no peer [${targetSocketId}]. Disparando ICE Restart para renegociação com STUN/TURN...`);
                    if (statusBadge) {
                        statusBadge.className = 'badge-status badge-offline';
                        statusBadge.innerText = iceState === 'failed' ? 'Falha (Reconectando)' : 'Reconectando...';
                    }
                    if (spinner) spinner.style.display = 'block';
                    if (placeholderText) placeholderText.innerText = 'Reconectando malha de áudio/vídeo...';

                    triggerIceRestart(targetSocketId, pc);
                } else if (iceState === 'closed') {
                    console.log(`🔴 [WebRTC Fechado] Conexão ICE encerrada com o peer [${targetSocketId}]`);
                }
            };

            pc.onconnectionstatechange = () => {
                const connState = pc.connectionState;
                console.log(`📡 [WebRTC Connection State Change] Peer [${targetSocketId}]: ${connState}`);
                if (connState === 'disconnected' || connState === 'failed') {
                    console.warn(`⚠️ [WebRTC ConnectionState] Estado '${connState}' com [${targetSocketId}]. Forçando ICE Restart...`);
                    triggerIceRestart(targetSocketId, pc);
                } else if (connState === 'connected') {
                    console.log(`🎉 [WebRTC P2P Conectado] Peer [${targetSocketId}] ativo na sessão de voz/vídeo.`);
                }
            };

            if (isInitiator) {
                pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                .then(offer => pc.setLocalDescription(offer).then(() => offer))
                .then(offer => {
                    const targetRoom = isPrivateCallActive ? privateCallRoom : currentVoiceRoom;
                    console.log(`📡 [WebRTC Oferta Inicial] Enviando oferta inicial para peer [${targetSocketId}] na sala [${targetRoom}]`);
                    socket.emit('offer', {
                        target: targetSocketId,
                        room: targetRoom,
                        offer: offer,
                        username: currentUser?.username || 'Usuário'
                    });
                })
                .catch(err => console.error(`❌ [WebRTC Erro Oferta Inicial] Falha ao criar offer para [${targetSocketId}]:`, err));
            }

            updateGridLayout();
            return pc;
        }

        const iceRestartDebounce = {};

        async function triggerIceRestart(targetSocketId, pc) {
            if (!pc || pc.signalingState === 'closed') {
                console.warn(`⚠️ [ICE Restart Ignorado] RTCPeerConnection para [${targetSocketId}] inexistente ou fechada.`);
                return;
            }

            const now = Date.now();
            if (iceRestartDebounce[targetSocketId] && (now - iceRestartDebounce[targetSocketId]) < 3500) {
                console.log(`⏱️ [ICE Restart Debounce] Aguardando intervalo de resiliência para o peer [${targetSocketId}]`);
                return;
            }
            iceRestartDebounce[targetSocketId] = now;

            console.warn(`🚀 [ICE Restart Iniciado] Forçando renegociação e novo mapeamento STUN/TURN para peer [${targetSocketId}]...`);

            try {
                if (typeof pc.restartIce === 'function') {
                    pc.restartIce();
                }

                const offer = await pc.createOffer({
                    iceRestart: true,
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });

                await pc.setLocalDescription(offer);

                const targetRoom = isPrivateCallActive ? privateCallRoom : currentVoiceRoom;
                if (socket.connected && targetRoom) {
                    socket.emit('offer', {
                        target: targetSocketId,
                        room: targetRoom,
                        offer: offer,
                        isIceRestart: true,
                        username: currentUser?.username || 'Usuário'
                    });
                    console.log(`📡 [ICE Restart] Oferta de recuperação enviada via Socket para o peer [${targetSocketId}]`);
                } else {
                    console.warn(`⚠️ [ICE Restart] Socket temporariamente offline.`);
                }
            } catch (err) {
                console.error(`❌ [ICE Restart Erro] Falha ao executar ICE Restart com [${targetSocketId}]:`, err);
            }
        }

        async function processIceCandidateQueueForPeer(socketId) {
            const queue = iceCandidateQueues[socketId];
            const pc = peerConnections[socketId];
            if (!queue || queue.length === 0 || !pc) return;
            if (!pc.remoteDescription || !pc.remoteDescription.type) return;

            console.log(`🚀 [ICE Queue] Processando ${queue.length} candidate(s) pendente(s) para [${socketId}]`);
            while (queue.length > 0) {
                const candidate = queue.shift();
                try {
                    await pc.addIceCandidate(candidate);
                } catch (e) {
                    console.warn(`Aviso ao aplicar ICE Candidate da fila para [${socketId}]:`, e);
                }
            }
        }

        function closePeerConnection(targetSocketId) {
            if (peerConnections[targetSocketId]) {
                const pc = peerConnections[targetSocketId];
                pc.ontrack = null;
                pc.onicecandidate = null;
                pc.oniceconnectionstatechange = null;
                pc.onconnectionstatechange = null;
                pc.close();
                delete peerConnections[targetSocketId];
            }
            if (remoteStreams[targetSocketId]) {
                remoteStreams[targetSocketId].getTracks().forEach(t => t.stop());
                delete remoteStreams[targetSocketId];
            }
            if (peerAudioNodes[targetSocketId]) {
                try {
                    peerAudioNodes[targetSocketId].sourceNode.disconnect();
                    peerAudioNodes[targetSocketId].gainNode.disconnect();
                } catch(e) {}
                delete peerAudioNodes[targetSocketId];
            }
            delete iceCandidateQueues[targetSocketId];
            delete peerUsernames[targetSocketId];

            const card = document.getElementById(`card-${targetSocketId}`);
            if (card) card.remove();

            updateGridLayout();
        }

        function updateAllPeersAudioTrack(track) {
            if (!track) return;
            localStream.getAudioTracks().forEach(t => localStream.removeTrack(t));
            localStream.addTrack(track);

            for (const [peerId, pc] of Object.entries(peerConnections)) {
                const senders = pc.getSenders();
                const audioSender = senders.find(s => (s.track && s.track.kind === 'audio') || (!s.track && s.kind === 'audio'));
                if (audioSender) audioSender.replaceTrack(track);
                else pc.addTrack(track, localStream);
            }
        }

        function updateAllPeersVideoTrack(track) {
            localStream.getVideoTracks().forEach(t => localStream.removeTrack(t));
            if (track) localStream.addTrack(track);

            for (const [peerId, pc] of Object.entries(peerConnections)) {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => (s.track && s.track.kind === 'video') || (!s.track && s.kind === 'video'));
                if (videoSender) videoSender.replaceTrack(track || null);
                else if (track) pc.addTrack(track, localStream);
            }
        }

        function emitMediaStateChange() {
            const targetRoom = isPrivateCallActive ? privateCallRoom : currentVoiceRoom;
            if (targetRoom && socket.connected) {
                socket.emit('media-state-change', {
                    room: targetRoom,
                    isMicMuted: isMicMuted,
                    isCameraOff: activeVideoType === 'none',
                    activeVideoType: activeVideoType
                });
            }
        }

        async function getOrCreateMicrophone() {
            if (micStream && micStream.getAudioTracks().some((t) => t.readyState === 'live')) {
                return micStream;
            }
            try {
                const rawMicStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false }
                });

                // Roteamento Web Audio API GainNode para ganho de sensibilidade local
                try {
                    const ctx = getOrCreateAudioContext();
                    if (ctx) {
                        localMicAudioContext = ctx;
                        localMicSource = ctx.createMediaStreamSource(rawMicStream);
                        localMicGainNode = ctx.createGain();
                        localMicGainNode.gain.value = userMicGainPreference;

                        localMicDestination = ctx.createMediaStreamDestination();
                        localMicSource.connect(localMicGainNode);
                        localMicGainNode.connect(localMicDestination);

                        micStream = localMicDestination.stream;
                    } else {
                        micStream = rawMicStream;
                    }
                } catch(localAudioErr) {
                    console.warn('Fallback: usando stream direta de microfone:', localAudioErr);
                    micStream = rawMicStream;
                }

                const audioTrack = micStream.getAudioTracks()[0];
                if (audioTrack) audioTrack.enabled = !isMicMuted;
                updateAllPeersAudioTrack(audioTrack);
                updateLocalStatus();
                return micStream;
            } catch (err) {
                console.warn('Microfone não acessível:', err);
                return null;
            }
        }

        function updateLocalStatus() {
            if (localStatusBadge) {
                if (activeVideoType === 'camera') {
                    localStatusBadge.className = 'badge-status badge-live';
                    localStatusBadge.innerText = 'Câmera Ativa';
                } else if (activeVideoType === 'screen') {
                    localStatusBadge.className = 'badge-status badge-live';
                    localStatusBadge.innerText = 'Tela Compartilhada';
                } else if (micStream && !isMicMuted) {
                    localStatusBadge.className = 'badge-status badge-live';
                    localStatusBadge.innerText = 'Microfone Ativo';
                } else {
                    localStatusBadge.className = 'badge-status badge-offline';
                    localStatusBadge.innerText = 'Offline';
                }
            }

            if (localFloatCam) {
                if (activeVideoType === 'camera' || activeVideoType === 'screen') {
                    localFloatCam.classList.add('active-green');
                    localFloatCam.classList.remove('active-danger');
                    localFloatCam.title = activeVideoType === 'camera' ? 'Câmera Ativa' : 'Tela Compartilhada';
                } else {
                    localFloatCam.classList.remove('active-green', 'active-danger');
                    localFloatCam.title = 'Câmera Desligada';
                }
            }

            if (btnCamera) {
                if (activeVideoType === 'camera') {
                    btnCamera.classList.remove('btn-active-danger');
                } else {
                    btnCamera.classList.add('btn-active-danger');
                }
            }

            if (localFloatMic) {
                if (isMicMuted) {
                    localFloatMic.className = 'floating-badge active-danger';
                    localFloatMic.title = 'Microfone Mutado';
                    localFloatMic.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>`;
                } else {
                    localFloatMic.className = 'floating-badge active-green';
                    localFloatMic.title = 'Microfone Ativo';
                    localFloatMic.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>`;
                }
            }

            if (btnMute) {
                if (isMicMuted) btnMute.classList.add('btn-active-danger');
                else btnMute.classList.remove('btn-active-danger');
            }

            if (btnPersistentMute) {
                if (isMicMuted) btnPersistentMute.classList.add('active-danger');
                else btnPersistentMute.classList.remove('active-danger');
            }

            if (btnPersistentMuteHome) {
                if (isMicMuted) btnPersistentMuteHome.classList.add('active-danger');
                else btnPersistentMuteHome.classList.remove('active-danger');
            }

            const myCard = document.getElementById('card-local');
            if (myCard) {
                const myFloatMic = myCard.querySelector('.floating-badge');
                if (myFloatMic) {
                    if (isMicMuted) {
                        myFloatMic.className = 'floating-badge active-danger';
                        myFloatMic.title = 'Microfone Mutado';
                    } else {
                        myFloatMic.className = 'floating-badge active-green';
                        myFloatMic.title = 'Microfone Ativo';
                    }
                }
            }

            if (btnScreen) {
                if (activeVideoType === 'screen') btnScreen.classList.add('btn-active-highlight');
                else btnScreen.classList.remove('btn-active-highlight');
            }

            emitMediaStateChange();
        }

        // Eventos WebRTC
        socket.on('room-users', async (data) => {
            console.log('👥 Participantes na sala:', data.users, '| Sala:', data.room);
            const isTargetVoice = (currentVoiceRoom && data.room === currentVoiceRoom) || (isPrivateCallActive && data.room === privateCallRoom);
            if (isTargetVoice || currentViewMode === 'voice') {
                await getOrCreateMicrophone();
                for (const otherUserId of data.users) {
                    createPeerConnection(otherUserId, true);
                }
                updateGridLayout();
            }
        });

        socket.on('user-joined', async (data) => {
            console.log('👤 Participante entrou:', data);
            const isTargetVoice = (currentVoiceRoom && (!data.room || data.room === currentVoiceRoom)) || isPrivateCallActive || (currentViewMode === 'voice');
            if (isTargetVoice) {
                soundManager.play('join');
                await getOrCreateMicrophone();
                peerUsernames[data.id] = data.username;
                getOrCreateRemoteCard(data.id, data.username);
                emitMediaStateChange();
                updateGridLayout();
            }
        });

        socket.on('offer', async (data) => {
            const offer = data.offer || data;
            const senderId = data.sender;
            if (!offer || !offer.type || !senderId) return;

            try {
                console.log(`📩 [WebRTC Oferta Recebida] Do peer [${senderId}] | isIceRestart: ${Boolean(data.isIceRestart)}`);
                await getOrCreateMicrophone();
                const pc = createPeerConnection(senderId, false, data.username);

                // Tratamento seguro de colisão / sinalização durante renegociação ou ICE Restart
                if (pc.signalingState !== 'stable') {
                    console.log(`🔄 [WebRTC Glare/Restart] Rollback no peer [${senderId}] (Estado atual: ${pc.signalingState})`);
                    await pc.setLocalDescription({ type: 'rollback' });
                }

                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                await processIceCandidateQueueForPeer(senderId);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                const targetRoom = isPrivateCallActive ? privateCallRoom : currentVoiceRoom;
                socket.emit('answer', {
                    target: senderId,
                    room: targetRoom,
                    answer: answer
                });
                console.log(`📡 [WebRTC Resposta Enviada] Answer enviada para o peer [${senderId}]`);
            } catch (err) {
                console.error(`❌ [WebRTC Erro de Oferta] Falha ao processar oferta de [${senderId}]:`, err);
            }
        });

        socket.on('answer', async (data) => {
            const answer = data.answer || data;
            const senderId = data.sender;
            if (!answer || !answer.type || !senderId) return;

            try {
                console.log(`📩 [WebRTC Resposta Recebida] Answer do peer [${senderId}]`);
                const pc = peerConnections[senderId];
                if (pc && pc.signalingState !== 'closed') {
                    if (pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                        await processIceCandidateQueueForPeer(senderId);
                        console.log(`✅ [WebRTC Negociação Concluída] Descrição remota aplicada para [${senderId}]`);
                    } else {
                        console.warn(`⚠️ [WebRTC Answer Ignorada] Peer [${senderId}] no estado '${pc.signalingState}'`);
                    }
                }
            } catch (err) {
                console.error(`❌ [WebRTC Erro de Resposta] Erro ao processar Answer de [${senderId}]:`, err);
            }
        });

        socket.on('ice-candidate', async (data) => {
            const candidateData = data.candidate;
            const senderId = data.sender;
            if (!candidateData || !senderId) return;

            try {
                const candidate = new RTCIceCandidate(candidateData);
                const pc = peerConnections[senderId];
                if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(candidate);
                } else {
                    if (!iceCandidateQueues[senderId]) iceCandidateQueues[senderId] = [];
                    iceCandidateQueues[senderId].push(candidate);
                }
            } catch (err) {
                console.error(`Erro ao processar ICE Candidate de [${senderId}]:`, err);
            }
        });

        socket.on('user-media-state-changed', (data) => {
            const senderId = data.sender;
            const floatMic = document.getElementById(`floatMic-${senderId}`);
            const floatCam = document.getElementById(`floatCam-${senderId}`);
            const placeholder = document.getElementById(`placeholder-${senderId}`);

            if (floatMic) {
                if (data.isMicMuted) {
                    floatMic.className = 'floating-badge active-danger';
                    floatMic.title = 'Microfone Mutado';
                    floatMic.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>`;
                } else {
                    floatMic.className = 'floating-badge active-green';
                    floatMic.title = 'Microfone Ativo';
                    floatMic.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>`;
                }
            }

            if (floatCam) {
                if (data.isCameraOff) {
                    floatCam.className = 'floating-badge';
                    floatCam.title = 'Câmera Desligada';
                    if (placeholder) placeholder.style.opacity = '1';
                } else {
                    floatCam.className = 'floating-badge active-green';
                    floatCam.title = 'Câmera Ativa';
                    if (placeholder) placeholder.style.opacity = '0';
                }
            }
        });

        socket.on('user-left', (data) => {
            console.log('🚪 Participante saiu:', data);
            soundManager.play('leave');
            closePeerConnection(data.id);
        });

        // ==========================================
        // 10. Desconexão e Teardown Gracioso (Sprint 6)
        // ==========================================
        function leaveVoiceChannel(notifyServer = true) {
            if (!currentVoiceRoom && !isPrivateCallActive) return;

            soundManager.play('leave');
            console.log('🛑 [Teardown Gracioso] Desconectando e encerrando todas as mídias e instâncias WebRTC...');

            // 1. Encerra ativamente todas as tracks de mídia local
            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
                cameraStream = null;
            }
            if (screenStream) {
                screenStream.getTracks().forEach(t => t.stop());
                screenStream = null;
            }
            if (micStream) {
                micStream.getTracks().forEach(t => t.stop());
                micStream = null;
            }
            localStream.getTracks().forEach(t => t.stop());

            activeVideoType = 'none';
            if (localVideo) localVideo.srcObject = null;
            if (localPlaceholder) localPlaceholder.style.opacity = '1';

            // 2. Fecha todas as conexões PeerConnection
            for (const peerId of Object.keys(peerConnections)) {
                closePeerConnection(peerId);
            }

            // 3. Notifica o servidor via Socket.IO
            if (notifyServer && currentVoiceRoom && socket.connected) {
                socket.emit('leave-room', currentVoiceRoom);
            }

            // 4. Limpa estado de voz e docks
            const exitedRoom = currentVoiceRoom;
            currentVoiceRoom = null;
            activeVoiceChannelObj = null;

            if (persistentVoiceDock) persistentVoiceDock.style.display = 'none';
            if (persistentVoiceDockHome) persistentVoiceDockHome.style.display = 'none';

            if (isChatOpen) toggleChatSidebar(false);
            updateGridLayout();
            updateLocalStatus();

            // 5. Se estiver visualizando o palco de voz, alterna para o canal de texto ou tela inicial
            if (currentViewMode === 'voice') {
                if (activeTextChannelObj) {
                    selectTextChannel(activeTextChannelObj);
                } else {
                    setViewMode('empty');
                }
            }

            if (webrtcStatusText) webrtcStatusText.innerText = 'Desconectado do canal de voz.';
            console.log(`✅ [Teardown Gracioso Concluído] Sessão de voz finalizada com sucesso (Canal: ${exitedRoom || 'nenhum'}).`);
        }

        function leaveRoom() {
            leaveVoiceChannel(true);
        }

        if (btnLeaveRoom) btnLeaveRoom.addEventListener('click', () => leaveVoiceChannel(true));
        if (btnPersistentDisconnect) btnPersistentDisconnect.addEventListener('click', (e) => { e.stopPropagation(); leaveVoiceChannel(true); });
        if (btnPersistentDisconnectHome) btnPersistentDisconnectHome.addEventListener('click', (e) => { e.stopPropagation(); leaveVoiceChannel(true); });

        if (btnReturnToVoiceStage) {
            btnReturnToVoiceStage.addEventListener('click', () => {
                openServerPanel();
                setViewMode('voice');
            });
        }

        if (btnReturnToVoiceStageHome) {
            btnReturnToVoiceStageHome.addEventListener('click', () => {
                openServerPanel();
                setViewMode('voice');
            });
        }

        if (btnPersistentMute) {
            btnPersistentMute.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMute();
            });
        }

        if (btnPersistentMuteHome) {
            btnPersistentMuteHome.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMute();
            });
        }

        // ==========================================
        // Controles de Mídia
        // ==========================================
        async function toggleCamera() {
            if (activeVideoType === 'camera') {
                if (cameraStream) {
                    cameraStream.getTracks().forEach((t) => t.stop());
                    cameraStream = null;
                }
                activeVideoType = 'none';
                updateAllPeersVideoTrack(null);
                if (localVideo) localVideo.srcObject = null;
                if (localPlaceholder) localPlaceholder.style.opacity = '1';
                updateLocalStatus();
                return;
            }

            if (activeVideoType === 'screen') stopScreenShareTracks();

            try {
                await getOrCreateMicrophone();
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } }
                });

                activeVideoType = 'camera';
                if (localVideo) {
                    localVideo.style.transform = 'scaleX(-1)';
                    localVideo.srcObject = cameraStream;
                }
                if (localPlaceholder) localPlaceholder.style.opacity = '0';

                updateAllPeersVideoTrack(cameraStream.getVideoTracks()[0]);
                updateLocalStatus();
            } catch (err) {
                console.error('Erro ao acessar câmera:', err);
                alert(`Não foi possível acessar a câmera: ${err.message || 'Permissão negada'}`);
            }
        }

        function stopScreenShareTracks() {
            if (screenStream) {
                screenStream.getTracks().forEach((t) => t.stop());
                screenStream = null;
            }
        }

        async function startScreenShareWithOptions(res, fps, shareAudio) {
            if (activeVideoType === 'camera') {
                if (cameraStream) {
                    cameraStream.getTracks().forEach((t) => t.stop());
                    cameraStream = null;
                }
            }

            const width = res === 1080 ? 1920 : 1280;
            const height = res === 1080 ? 1080 : 720;

            const videoConstraints = {
                width: { ideal: width, max: width },
                height: { ideal: height, max: height },
                frameRate: { ideal: fps, max: fps }
            };

            try {
                await getOrCreateMicrophone();
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: videoConstraints,
                    audio: shareAudio
                });

                activeVideoType = 'screen';
                if (localVideo) {
                    localVideo.style.transform = 'none';
                    localVideo.srcObject = screenStream;
                }
                if (localPlaceholder) localPlaceholder.style.opacity = '0';

                updateAllPeersVideoTrack(screenStream.getVideoTracks()[0]);
                updateLocalStatus();

                const videoTrack = screenStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.onended = () => {
                        if (activeVideoType === 'screen') toggleScreenShare();
                    };
                }
            } catch (err) {
                console.error('Erro ao compartilhar tela:', err);
            }
        }

        async function toggleScreenShare() {
            if (activeVideoType === 'screen') {
                stopScreenShareTracks();
                activeVideoType = 'none';
                updateAllPeersVideoTrack(null);
                if (localVideo) localVideo.srcObject = null;
                if (localPlaceholder) localPlaceholder.style.opacity = '1';
                updateLocalStatus();
                return;
            }

            openScreenShareSettingsModal();
        }

        async function toggleMute() {
            if (!micStream) await getOrCreateMicrophone();
            if (!micStream) {
                alert('Não foi possível obter acesso ao microfone.');
                return;
            }

            isMicMuted = !isMicMuted;
            micStream.getAudioTracks().forEach((t) => (t.enabled = !isMicMuted));

            soundManager.play(isMicMuted ? 'mute' : 'unmute');

            if (isMicMuted) {
                if (micIcon) micIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />`;
            } else {
                if (micIcon) micIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />`;
            }
            updateLocalStatus();
        }

        if (btnCamera) btnCamera.addEventListener('click', toggleCamera);
        if (btnScreen) btnScreen.addEventListener('click', toggleScreenShare);
        if (btnMute) btnMute.addEventListener('click', toggleMute);

        // ==========================================
        // 11. Inicialização do Auth Gate
        // ==========================================
        async function verifyAuthAndInit() {
            if (!authToken) {
                showAuthGate();
                checkUrlInviteParam();
                return;
            }

            try {
                const res = await fetch('/me', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (!res.ok) {
                    throw new Error('Sessão expirada ou token inválido');
                }

                const data = await res.json();
                enterApp(data.user);
            } catch (err) {
                console.warn('Falha na validação do token:', err);
                logoutApp('Sua sessão expirou. Faça login novamente.');
                checkUrlInviteParam();
            }
        }

        // Execução inicial
        verifyAuthAndInit();