const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, "data.json");

// Fungsi baca data
function readDB(){
  if(!fs.existsSync(DB_FILE)){
    fs.writeFileSync(DB_FILE, JSON.stringify({ users:{} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

// Fungsi tulis data
function writeDB(data){
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

io.on("connection", socket => {
  console.log("Connected:", socket.id);

  // Join user
  socket.on("join", userId => {
    const db = readDB();
    if(!db.users[userId]){
      db.users[userId] = { balance: 50000 };
      writeDB(db);
    }
    socket.join(userId);
    console.log(`JOIN ${userId}`);
    socket.emit("saldoUpdate", { userId, balance: db.users[userId].balance });
  });

  // Update saldo admin
  socket.on("adminUpdateSaldo", ({ userId, balance }) => {
    const db = readDB();
    if(!db.users[userId]) db.users[userId] = { balance: 0 };
    db.users[userId].balance = Number(balance);
    writeDB(db);
    io.to(userId).emit("saldoUpdate", { userId, balance: Number(balance) });
  });

  // Reset saldo admin
  socket.on("adminResetSaldo", userId => {
    const db = readDB();
    db.users[userId] = { balance: 0 };
    writeDB(db);
    io.to(userId).emit("saldoUpdate", { userId, balance: 0 });
  });
});

// Gunakan port dari environment (Render)
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
