const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
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

  socket.on("adminCheckSaldo", userId => {
    if (!userId) return;

    const db = readDB();
    const balance = db.users[userId]?.balance ?? 0;

    io.to(userId).emit("saldoUpdate", {
      userId,
      balance
    });
  });

  socket.on("adminUpdateSaldo", data => {
    if (!data || !data.userId) return;

    const db = readDB();
    const newBalance = Number(data.balance) || 0;

    if (!db.users[data.userId]) {
      db.users[data.userId] = { balance: 50000 };
    }

    db.users[data.userId].balance = newBalance;
    writeDB(db);

    console.log(`Update saldo ${data.userId}: ${newBalance}`);

    io.to(data.userId).emit("saldoUpdate", {
      userId: data.userId,
      balance: newBalance
    });
  });

  socket.on("adminResetSaldo", userId => {
    if (!userId) return;

    const db = readDB();
    db.users[userId] = { balance: 50000 };
    writeDB(db);

    console.log(`Reset saldo ${userId}`);

    io.to(userId).emit("saldoUpdate", {
      userId,
      balance: 50000
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
