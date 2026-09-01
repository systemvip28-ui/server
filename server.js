<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>WhatsApp Mobile</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: #111b21;
            color: #e9edef;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        /* Container Mobile Frame */
        .mobile-container {
            width: 100%;
            max-width: 450px;
            height: 100vh;
            background-color: #111b21;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }

        /* SCREEN 1: FORM REGISTRASI */
        .auth-screen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px;
            height: 100%;
            background-color: #111b21;
            z-index: 10;
        }

        .auth-screen i.logo {
            font-size: 65px;
            color: #00a884;
            margin-bottom: 20px;
        }

        .auth-screen h2 {
            margin-bottom: 25px;
            font-size: 22px;
            color: #e9edef;
        }

        .input-group {
            width: 100%;
            margin-bottom: 15px;
        }

        .input-group label {
            display: block;
            font-size: 13px;
            color: #8696a0;
            margin-bottom: 5px;
        }

        .input-group input {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #2a3942;
            background-color: #202c33;
            color: #fff;
            font-size: 15px;
            outline: none;
        }

        .btn-submit {
            width: 100%;
            padding: 14px;
            background-color: #00a884;
            color: #111b21;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 15px;
        }

        /* SCREEN 2: DASHBOARD UTAMA */
        .app-screen {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
        }

        /* Top Header */
        .top-header {
            background-color: #202c33;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .app-title {
            font-size: 20px;
            font-weight: 600;
            color: #8696a0;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 18px;
        }

        .header-actions i {
            font-size: 18px;
            color: #aebac1;
            cursor: pointer;
        }

        /* User Profile Avatar Icon Top Right */
        .my-avatar-btn {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            object-fit: cover;
            cursor: pointer;
            border: 2px solid #00a884;
        }

        /* Navigation Tabs */
        .tabs {
            display: flex;
            background-color: #202c33;
            border-bottom: 1px solid #222d34;
        }

        .tab-btn {
            flex: 1;
            padding: 12px 0;
            text-align: center;
            background: none;
            border: none;
            color: #8696a0;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            border-bottom: 3px solid transparent;
        }

        .tab-btn.active {
            color: #00a884;
            border-bottom: 3px solid #00a884;
        }

        /* Main Content List / Chat Area */
        .content-area {
            flex: 1;
            overflow-y: auto;
            background-color: #0b141a;
            position: relative;
        }

        /* Chat Item List */
        .user-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #202c33;
            cursor: pointer;
        }

        .user-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 15px;
        }

        .user-details {
            flex: 1;
        }

        .user-name {
            font-weight: 500;
            font-size: 16px;
            color: #e9edef;
            display: flex;
            justify-content: space-between;
        }

        .user-bio {
            font-size: 13px;
            color: #8696a0;
            margin-top: 3px;
        }

        /* Realtime Chat Box Area */
        .chat-box {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 10px;
            overflow-y: auto;
        }

        .msg-bubble {
            max-width: 75%;
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
        }

        .msg-received {
            background-color: #202c33;
            align-self: flex-start;
        }

        .msg-sent {
            background-color: #005c4b;
            align-self: flex-end;
        }

        .msg-author {
            font-size: 11px;
            color: #00a884;
            font-weight: bold;
            margin-bottom: 3px;
        }

        .msg-time {
            font-size: 10px;
            color: #8696a0;
            float: right;
            margin-left: 10px;
            margin-top: 5px;
        }

        /* Bottom Input Bar */
        .chat-input-bar {
            background-color: #202c33;
            padding: 8px 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chat-input-bar input {
            flex: 1;
            background-color: #2a3942;
            border: none;
            padding: 10px 15px;
            border-radius: 20px;
            color: #fff;
            outline: none;
            font-size: 15px;
        }

        .send-btn {
            background-color: #00a884;
            color: #111b21;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
        }

        /* MODAL PROFIL & LOGOUT */
        .modal-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: flex-end;
            z-index: 99;
        }

        .profile-modal {
            width: 100%;
            background-color: #222e35;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
            padding: 25px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }

        .modal-avatar {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 15px;
            border: 3px solid #00a884;
        }

        .modal-name {
            font-size: 18px;
            font-weight: bold;
            color: #fff;
        }

        .modal-bio {
            font-size: 14px;
            color: #8696a0;
            margin-bottom: 20px;
        }

        .btn-danger {
            width: 100%;
            padding: 12px;
            background-color: #ea4335;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
        }

        .btn-secondary {
            width: 100%;
            padding: 12px;
            background-color: #3b4a54;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 10px;
        }

        .hidden {
            display: none !important;
        }
    </style>
</head>
<body>

    <div class="mobile-container">

        <div id="authScreen" class="auth-screen">
            <i class="fa-brands fa-whatsapp logo"></i>
            <h2>Selamat Datang di WhatsApp</h2>
            <div class="input-group">
                <label>Nama Lengkap</label>
                <input type="text" id="regName" placeholder="Masukkan nama Anda..." required>
            </div>
            <div class="input-group">
                <label>Info / Bio</label>
                <input type="text" id="regBio" placeholder="Ada di tempat kerja / Sibuk" value="Ada di tempat kerja">
            </div>
            <div class="input-group">
                <label>URL Foto Profil (Opsional)</label>
                <input type="text" id="regAvatar" placeholder="https://example.com/foto.jpg">
            </div>
            <button class="btn-submit" onclick="registerUser()">Masuk ke WhatsApp</button>
        </div>

        <div id="appScreen" class="app-screen hidden">
            <div class="top-header">
                <div class="app-title">WhatsApp</div>
                <div class="header-actions">
                    <i class="fa-solid fa-camera"></i>
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <img id="myAvatarHeader" src="" class="my-avatar-btn" onclick="openProfileModal()">
                </div>
            </div>

            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('chats')">CHAT</button>
                <button class="tab-btn" onclick="switchTab('users')">ANGGOTA</button>
                <button class="tab-btn" onclick="switchTab('calls')">PANGGILAN</button>
            </div>

            <div class="content-area">

                <div id="tab-chats" style="height: 100%; display: flex; flex-direction: column;">
                    <div class="chat-box" id="chatMessages">
                        </div>
                    <div class="chat-input-bar">
                        <i class="fa-regular fa-face-smile" style="font-size: 20px; color: #8696a0;"></i>
                        <input type="text" id="messageInput" placeholder="Ketik pesan..." onkeypress="handleKeyPress(event)">
                        <button class="send-btn" onclick="sendMsg()">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <div id="tab-users" class="hidden">
                    <div id="userList"></div>
                </div>

                <div id="tab-calls" class="hidden" style="padding: 20px; text-align: center; color: #8696a0;">
                    <i class="fa-solid fa-phone-slash" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>Belum ada riwayat panggilan.</p>
                </div>
            </div>
        </div>

        <div id="profileModal" class="modal-overlay hidden">
            <div class="profile-modal">
                <img id="modalAvatarImg" src="" class="modal-avatar">
                <div id="modalName" class="modal-name">Nama User</div>
                <div id="modalBio" class="modal-bio">Bio User</div>

                <div class="input-group">
                    <label>Ubah URL Foto Profil (Real-time)</label>
                    <input type="text" id="newAvatarUrl" placeholder="Tempel URL Foto Baru...">
                </div>
                <button class="btn-submit" style="border-radius: 8px; margin-top:0;" onclick="changeAvatar()">Simpan Foto Profil</button>
                
                <button class="btn-danger" onclick="logout()">Logout</button>
                <button class="btn-secondary" onclick="closeProfileModal()">Tutup</button>
            </div>
        </div>

    </div>

    <script>
        const socket = io();
        let currentUser = null;

        // 1. REGISTRASI USER
        function registerUser() {
            const name = document.getElementById('regName').value.trim();
            const bio = document.getElementById('regBio').value.trim();
            const avatar = document.getElementById('regAvatar').value.trim();

            if (!name) {
                alert('Nama lengkap wajib diisi!');
                return;
            }

            socket.emit('register', { name, bio, avatar });
        }

        // Response setelah registrasi berhasil
        socket.on('registered', (userData) => {
            currentUser = userData;
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('appScreen').classList.remove('hidden');

            // Set Avatar Header Atas Kanan
            document.getElementById('myAvatarHeader').src = currentUser.avatar;
        });

        // 2. SWITCH TAB
        function switchTab(tabName) {
            document.getElementById('tab-chats').classList.add('hidden');
            document.getElementById('tab-users').classList.add('hidden');
            document.getElementById('tab-calls').classList.add('hidden');

            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => btn.classList.remove('active'));

            document.getElementById('tab-' + tabName).classList.remove('hidden');
            event.target.classList.add('active');
        }

        // 3. PESAN REALTIME
        function sendMsg() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (text !== '') {
                socket.emit('sendMessage', text);
                input.value = '';
            }
        }

        function handleKeyPress(e) {
            if (e.key === 'Enter') sendMsg();
        }

        socket.on('newMessage', (msg) => {
            const container = document.getElementById('chatMessages');
            const isSentByMe = msg.senderId === socket.id;

            const msgHtml = `
                <div class="msg-bubble ${isSentByMe ? 'msg-sent' : 'msg-received'}">
                    ${!isSentByMe ? `<div class="msg-author">${msg.senderName}</div>` : ''}
                    <div>${msg.text}</div>
                    <div class="msg-time">${msg.time}</div>
                </div>
            `;
            container.innerHTML += msgHtml;
            container.scrollTop = container.scrollHeight;
        });

        // 4. DAFTAR ANGGOTA TERHUBUNG (SERVERS)
        socket.on('userListUpdate', (users) => {
            const userListEl = document.getElementById('userList');
            userListEl.innerHTML = '';
            users.forEach(u => {
                userListEl.innerHTML += `
                    <div class="user-item">
                        <img src="${u.avatar}" class="user-avatar">
                        <div class="user-details">
                            <div class="user-name">
                                <span>${u.name} ${u.id === socket.id ? '(Saya)' : ''}</span>
                            </div>
                            <div class="user-bio">${u.bio}</div>
                        </div>
                    </div>
                `;
            });
        });

        // 5. MODAL PROFIL & UBAH FOTO REAL-TIME (Top Right Icon Click)
        function openProfileModal() {
            if (!currentUser) return;
            document.getElementById('modalAvatarImg').src = currentUser.avatar;
            document.getElementById('modalName').innerText = currentUser.name;
            document.getElementById('modalBio').innerText = currentUser.bio;
            document.getElementById('profileModal').classList.remove('hidden');
        }

        function closeProfileModal() {
            document.getElementById('profileModal').classList.add('hidden');
        }

        function changeAvatar() {
            const url = document.getElementById('newAvatarUrl').value.trim();
            if (url) {
                socket.emit('updateAvatar', url);
            }
        }

        socket.on('avatarUpdated', (newUrl) => {
            currentUser.avatar = newUrl;
            document.getElementById('myAvatarHeader').src = newUrl;
            document.getElementById('modalAvatarImg').src = newUrl;
            document.getElementById('newAvatarUrl').value = '';
            alert('Foto profil berhasil diperbarui secara real-time!');
        });

        // 6. LOGOUT
        function logout() {
            location.reload(); // Reload halaman untuk memutus socket connection dan reset state
        }
    </script>
</body>
</html>