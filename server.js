const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const DB_FILE = path.join(__dirname, "data.json");

// ================= DB Helper =================
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= Socket.IO =================
io.on("connection", socket => {
  console.log("Client connected:", socket.id);

  // user join room
  socket.on("join", userId => {
    if (!userId) return;
    socket.join(userId);

    const db = readDB();
    if (!db.users[userId]) {
      db.users[userId] = { balance: 50000, status: "Aktif" };
      writeDB(db);
    }

    io.to(userId).emit("statusUpdate", {
      userId,
      balance: db.users[userId].balance,
      status: db.users[userId].status
    });
  });

  // admin cek saldo/status
  socket.on("adminCheckSaldo", userId => {
    if (!userId) return;
    const db = readDB();
    const user = db.users[userId] || { balance: 50000, status: "Aktif" };
    io.to(userId).emit("statusUpdate", {
      userId,
      balance: user.balance,
      status: user.status
    });
  });

  // admin update saldo / teks
  socket.on("adminSendMessage", data => {
    if (!data || !data.userId || !data.content) return;

    const db = readDB();
    const userId = data.userId;
    let payload = {};

    if (!db.users[userId]) db.users[userId] = { balance: 50000, status: "Aktif" };

    // angka → update saldo + status otomatis
    if (!isNaN(data.content)) {
      const newBalance = Number(data.content);
      db.users[userId].balance = newBalance;
      db.users[userId].status = newBalance > 0 ? "Aktif" : "Blocked";
      writeDB(db);

      payload = { type: "status", userId, balance: newBalance, status: db.users[userId].status };
    } else {
      // teks bebas → update status saja, saldo tetap
      db.users[userId].status = data.content;
      writeDB(db);

      payload = { type: "status", userId, status: data.content };
    }

    io.to(userId).emit("statusUpdate", payload);
    console.log("Admin sent:", payload);
  });

  // admin reset saldo → saldo 50k + status Aktif
  socket.on("adminResetSaldo", userId => {
    if (!userId) return;
    const db = readDB();
    db.users[userId] = { balance: 50000, status: "Aktif" };
    writeDB(db);

    io.to(userId).emit("statusUpdate", { userId, balance: 50000, status: "Aktif" });
    console.log(`Reset user ${userId} → Rp50.000 Aktif`);
  });

  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// serve static files (optional)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
