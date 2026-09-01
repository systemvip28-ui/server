const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name:     'davgb7tjm',        
  api_key:        '211214865765642',          
  api_secret:     '3OG8-xUQlkYGt1uYO7yrPVoPFCo',  
  secure: true
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => res.status(200).send('Live'));

// State Management
const users = new Map(); // Menyimpan data user online
const stories = []; // Menyimpan story/status
const activeCalls = new Map();

function broadcastOnlineUsers() {
  const onlineList = Array.from(users.entries()).map(([id, info]) => ({ socketId: id, ...info }));
  io.emit("online-users", onlineList);
  io.emit("online-count", onlineList.length);
}

io.on('connection', (socket) => {
  
  socket.on('join', (data) => {
    const userData = {
      name: data.name || 'Anonim',
      bio: data.bio || 'Available',
      avatar: data.avatar || '',
      server: data.server || 'default',
    };
    users.set(socket.id, userData);
    broadcastOnlineUsers();
    
    // Kirim story yang aktif ke user yang baru join
    socket.emit('update-stories', stories);
  });

  // Update Profile
  socket.on('update-profile', (data) => {
    if (users.has(socket.id)) {
      const user = users.get(socket.id);
      user.name = data.name || user.name;
      user.bio = data.bio || user.bio;
      user.avatar = data.avatar || user.avatar;
      users.set(socket.id, user);
      broadcastOnlineUsers();
    }
  });

  // Direct Message (Private Chat)
  socket.on('private-message', (msgData) => {
    const targetSocket = io.sockets.sockets.get(msgData.to);
    if (targetSocket) {
      const messageId = uuidv4();
      targetSocket.emit('message', { 
        ...msgData, id: messageId, from: socket.id, timestamp: Date.now() 
      });
      socket.emit('message-confirmed', { id: messageId });
    }
  });

  // System Story
  socket.on('add-story', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const newStory = {
      id: uuidv4(),
      userId: socket.id,
      name: user.name,
      avatar: user.avatar,
      url: data.url,
      type: data.type, // 'image' or 'video'
      caption: data.caption,
      views: [],
      timestamp: Date.now()
    };
    stories.push(newStory);
    io.emit('update-stories', stories); // Broadcast ke semua
  });

  socket.on('view-story', (storyId) => {
    const story = stories.find(s => s.id === storyId);
    if (story && !story.views.some(v => v.id === socket.id)) {
      const user = users.get(socket.id);
      story.views.push({ id: socket.id, name: user ? user.name : 'Unknown', avatar: user ? user.avatar : '' });
      io.emit('update-stories', stories); // Update info views
    }
  });

  // Calls
  socket.on('call-user', (data) => {
    const targetSocket = io.sockets.sockets.get(data.to);
    if (targetSocket) {
      activeCalls.set(socket.id, { to: data.to, timeout: setTimeout(() => {
        socket.emit('call-timeout');
        activeCalls.delete(socket.id);
      }, 30000)});
      targetSocket.emit('incoming-call', { from: socket.id, name: users.get(socket.id)?.name });
    }
  });

  socket.on('accept-call', (data) => {
    const caller = io.sockets.sockets.get(data.to);
    if (caller) caller.emit('call-accepted', { from: socket.id });
  });

  socket.on('reject-call', (data) => {
    const caller = io.sockets.sockets.get(data.to);
    if (caller) caller.emit('call-rejected');
  });

  socket.on('offer', (data) => {
    const target = io.sockets.sockets.get(data.to);
    if (target) target.emit('offer', { offer: data.offer, from: socket.id });
  });

  socket.on('answer', (data) => {
    const target = io.sockets.sockets.get(data.to);
    if (target) target.emit('answer', { answer: data.answer, from: socket.id });
  });

  socket.on('ice', (data) => {
    const target = io.sockets.sockets.get(data.to);
    if (target) target.emit('ice', { candidate: data.candidate, from: socket.id });
  });

  socket.on('end-call', (data) => {
    const target = io.sockets.sockets.get(data.to);
    if (target) target.emit('end-call');
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    // Hapus story user yang offline (opsional, bisa dibiarkan bertahan 24 jam dengan cron/setTimeout)
    broadcastOnlineUsers();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server jalan di port ${PORT}`));