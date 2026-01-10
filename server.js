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

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

io.on("connection", socket => {
  console.log("Client connected:", socket.id);

  // User join room
  socket.on("join", userId => {
    if (!userId) return;
    socket.join(userId);
    console.log(`User join room: ${userId}`);

    const db = readDB();
    if (!db.users[userId]) {
      db.users[userId] = { balance: 50000 };
      writeDB(db);
    }

    io.to(userId).emit("saldoUpdate", {
      userId,
      balance: db.users[userId].balance
    });
  });

  // Admin check saldo
  socket.on("adminCheckSaldo", userId => {
    if (!userId) return;
    const db = readDB();
    const balance = db.users[userId]?.balance ?? 0;
    io.to(userId).emit("saldoUpdate", { userId, balance });
  });

  // Admin update saldo / kirim teks
  socket.on("adminSendMessage", data => {
    if (!data || !data.userId || !data.content) return;
    const db = readDB();
    const userId = data.userId;
    let messagePayload = {};

    if (!isNaN(data.content)) {
      // Update saldo jika content angka
      const newBalance = Number(data.content);
      if (!db.users[userId]) db.users[userId] = { balance: 50000 };
      db.users[userId].balance = newBalance;
      writeDB(db);

      console.log(`Update saldo ${userId}: ${newBalance}`);

      messagePayload = {
        type: "saldo",
        userId,
        balance: newBalance,
        display: `Rp${newBalance.toLocaleString()}`
      };
    } else {
      // Kirim pesan teks jika content bukan angka
      messagePayload = {
        type: "text",
        userId,
        message: data.content
      };
      console.log(`Kirim pesan ke ${userId}: ${data.content}`);
    }

    io.to(userId).emit("adminMessage", messagePayload);
  });

  // Admin reset saldo
  socket.on("adminResetSaldo", userId => {
    if (!userId) return;
    const db = readDB();
    db.users[userId] = { balance: 50000 };
    writeDB(db);

    console.log(`Reset saldo ${userId}`);
    io.to(userId).emit("saldoUpdate", { userId, balance: 50000 });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
