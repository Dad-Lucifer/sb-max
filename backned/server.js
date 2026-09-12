const http = require("http");
const app = require("./src/index");
const { Server } = require("socket.io");


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [ "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
  }
});



// expose io globally
global.io = io;

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
