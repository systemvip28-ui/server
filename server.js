const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Memungkinkan Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Menyajikan file statis dari folder public
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Menyimpan data user aktif di memory server
const users = {};

io.on('connection', (socket) => {
  console.log('User terhubung:', socket.id);

  // Event Registrasi User
  socket.on('register', (data) => {
    users[socket.id] = {
      id: socket.id,
      name: data.name,
      bio: data.bio,
      avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`
    };

    // Kirim konfirmasi registrasi ke user tersebut
    socket.emit('registered', users[socket.id]);

    // Beritahu pengguna lain bahwa ada user baru
    io.emit('userListUpdate', Object.values(users));
  });

  // Event Update Foto Profil Real-time
  socket.on('updateAvatar', (newAvatarUrl) => {
    if (users[socket.id]) {
      users[socket.id].avatar = newAvatarUrl;
      
      // Update data di sisi client yang mengirim
      socket.emit('avatarUpdated', newAvatarUrl);

      // Siarkan pembaruan daftar user ke semua client
      io.emit('userListUpdate', Object.values(users));
    }
  });

  // Event Kirim Pesan Real-time
  socket.on('sendMessage', (messageText) => {
    const user = users[socket.id];
    if (user) {
      const msgData = {
        senderId: socket.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Kirim pesan ke semua client yang terhubung
      io.emit('newMessage', msgData);
    }
  });

  // Event Disconnect / Logout
  socket.on('disconnect', () => {
    console.log('User terputus:', socket.id);
    delete users[socket.id];
    io.emit('userListUpdate', Object.values(users));
  });
});

// Port dinamis agar kompatibel dengan Render.com
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server WhatsApp Clone berjalan di port ${PORT}`);
});