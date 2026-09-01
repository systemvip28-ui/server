const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'davgb7tjm',        
  api_key: '211214865765642',          
  api_secret: '3OG8-xUQlkYGt1uYO7yrPVoPFCo',  
  secure: true
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => res.status(200).send('Server AnonChat Live'));

// STATE MANAGEMENT
const users = new Map(); // Key: userId -> Value: userData
const socketToUser = new Map(); // Key: socket.id -> Value: userId
let stories = []; 

function getActiveStories() {
  const now = Date.now();
  // Filter story yang umurnya kurang dari 24 jam
  stories = stories.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000);
  return stories;
}

function broadcastUsers() {
  const usersList = Array.from(users.values()).map(u => ({
    userId: u.userId, name: u.name, bio: u.bio, avatar: u.avatar,
    lat: u.lat, lon: u.lon, online: u.online, lastSeen: u.lastSeen
  }));
  io.emit("online-users", usersList);
}

io.on('connection', (socket) => {
  
  socket.on('join', (data) => {
    const userId = data.userId;
    socketToUser.set(socket.id, userId);
    
    const existingUser = users.get(userId) || { blockedBy: [], blockedUsers: [] };
    
    users.set(userId, {
      ...existingUser,
      userId: userId,
      socketId: socket.id,
      name: data.name || 'Anonim',
      bio: data.bio || 'Available',
      avatar: data.avatar || '',
      lat: data.lat || null,
      lon: data.lon || null,
      online: true,
      lastSeen: Date.now()
    });

    broadcastUsers();
    socket.emit('update-stories', getActiveStories());
  });

  socket.on('update-location', (coords) => {
    const userId = socketToUser.get(socket.id);
    if(userId && users.has(userId)) {
      const u = users.get(userId);
      u.lat = coords.lat; u.lon = coords.lon;
      broadcastUsers();
    }
  });

  // PRIVATE MESSAGE
  socket.on('private-message', (msgData) => {
    const senderId = socketToUser.get(socket.id);
    const targetUserId = msgData.to;
    const target = users.get(targetUserId);
    const sender = users.get(senderId);

    if (target) {
      // Cek Blokir
      if (target.blockedUsers && target.blockedUsers.includes(senderId)) {
        return socket.emit('message-error', { error: 'blocked', by: targetUserId });
      }

      if (target.online && target.socketId) {
        io.to(target.socketId).emit('message', { 
          ...msgData, from: senderId, timestamp: Date.now() 
        });
      }
    }
  });

  // BLOKIR USER
  socket.on('block-user', (targetId) => {
    const myId = socketToUser.get(socket.id);
    const me = users.get(myId);
    if(me) {
      if(!me.blockedUsers) me.blockedUsers = [];
      if(!me.blockedUsers.includes(targetId)) me.blockedUsers.push(targetId);
      
      const target = users.get(targetId);
      if(target && target.online) {
        io.to(target.socketId).emit('you-are-blocked', { by: myId });
      }
    }
  });

  // STORIES (STATUS)
  socket.on('add-story', (data) => {
    const userId = socketToUser.get(socket.id);
    const user = users.get(userId);
    if (!user) return;
    
    stories.push({
      id: uuidv4(), userId: userId, name: user.name, avatar: user.avatar,
      url: data.url, type: data.type, caption: data.caption, views: [], timestamp: Date.now()
    });
    io.emit('update-stories', getActiveStories());
  });

  socket.on('view-story', (storyId) => {
    const userId = socketToUser.get(socket.id);
    const user = users.get(userId);
    const story = stories.find(s => s.id === storyId);
    if (story && story.userId !== userId && !story.views.some(v => v.id === userId)) {
      story.views.push({ id: userId, name: user ? user.name : 'User', avatar: user ? user.avatar : '' });
      io.emit('update-stories', getActiveStories());
    }
  });

  socket.on('delete-story', (storyId) => {
    const userId = socketToUser.get(socket.id);
    stories = stories.filter(s => !(s.id === storyId && s.userId === userId));
    io.emit('update-stories', getActiveStories());
  });

  // WEBRTC CALLS
  socket.on('call-user', (data) => {
    const senderId = socketToUser.get(socket.id);
    const target = users.get(data.to);
    if (target && target.online) io.to(target.socketId).emit('incoming-call', { from: senderId, name: users.get(senderId)?.name });
  });

  socket.on('accept-call', (data) => {
    const senderId = socketToUser.get(socket.id);
    const target = users.get(data.to);
    if (target && target.online) io.to(target.socketId).emit('call-accepted', { from: senderId });
  });

  socket.on('reject-call', (data) => {
    const target = users.get(data.to);
    if (target && target.online) io.to(target.socketId).emit('call-rejected');
  });

  socket.on('offer', (data) => {
    const senderId = socketToUser.get(socket.id);
    const target = users.get(data.to);
    if (target && target.online) io.to(target.socketId).emit('offer', { offer: data.offer, from: senderId });
  });

  socket.on('answer', (data) => {
    const senderId = socketToUser.get(socket.id);
    const target = users.get(data.to);
    if (target && target.online) io.to(target.socketId).emit('answer', { answer: data.answer, from: senderId });
  });

  socket.on('ice', (data) => {
    const senderId = socketToUser.get(socket.id);
    const target = users.get(data.to);
    if (target && target.online) io.to(target.socketId).emit('ice', { candidate: data.candidate, from: senderId });
  });

  socket.on('end-call', (data) => {
    const target = users.get(data.to);
    if (target && target.online) io.to(target.socketId).emit('end-call');
  });

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId && users.has(userId)) {
      const u = users.get(userId);
      u.online = false;
      u.lastSeen = Date.now();
      broadcastUsers();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server jalan di port ${PORT}`));