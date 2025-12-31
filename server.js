const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

/* ROUTE TEST RENDER */
app.get("/", (req, res) => {
  res.send("✅ Socket.io Render aktif");
});

/* DATABASE FILE */
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

/* SOCKET LOGIC */
io.on("connection", socket => {
  console.log("Connected:", socket.id);

  socket.on("join", userId => {
    const db = readDB();

    if (!db.users[userId]) {
      db.users[userId] = { balance: 50000 };
      writeDB(db);
    }

    socket.join(userId);

    socket.emit("saldoUpdate", {
      userId,
      balance: db.users[userId].balance
    });
  });

  socket.on("adminCheckSaldo", userId => {
    const db = readDB();
    const balance = db.users[userId]?.balance || 0;

    socket.emit("saldoUpdate", {
      userId,
      balance
    });
  });

  socket.on("adminUpdateSaldo", ({ userId, balance }) => {
    const db = readDB();

    if (!db.users[userId]) {
      db.users[userId] = { balance: 0 };
    }

    db.users[userId].balance = Number(balance);
    writeDB(db);

    io.to(userId).emit("saldoUpdate", {
      userId,
      balance: Number(balance)
    });
  });

  socket.on("adminResetSaldo", userId => {
    const db = readDB();
    db.users[userId] = { balance: 0 };
    writeDB(db);

    io.to(userId).emit("saldoUpdate", {
      userId,
      balance: 0
    });
  });
});

/* PORT WAJIB DARI RENDER */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
