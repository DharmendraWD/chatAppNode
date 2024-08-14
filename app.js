const { v4: uuidv4 } = require('uuid');
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static Folder
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});

// Setup Websocket
let users = [];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const id = 123456;

  if (token == undefined || token != id) {
    console.log("---");
  } else {
    next();
  }
});

const chatNameSpace = io.of("/chat");

chatNameSpace.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listening
  socket.on("disconnect", () => {
    const index = users.findIndex((s) => s.id == socket.id);
    if (index != -1) users.splice(index, 1);
    chatNameSpace.emit("online", users);
    console.log("User Disconnected");
  });


// Handle chat messages
socket.on("chat message", (data) => {
  const date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (+hours <= 9) hours = `0${hours}`;
  if (+minutes <= 9) minutes = `0${minutes}`;
  data.date = `${hours}:${minutes}`;
  data.messageId = uuidv4(); // Ensure unique ID for each message
  chatNameSpace.to(data.roomNumber).emit("chat message", data);
});

// Handle image messages
socket.on("sendImage", (data) => {
  const date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (+hours <= 9) hours = `0${hours}`;
  if (+minutes <= 9) minutes = `0${minutes}`;
  data.date = `${hours}:${minutes}`;
  data.messageId = uuidv4(); // Ensure unique ID for each image message
  chatNameSpace.to(data.roomNumber).emit("image message", data);
});


  socket.on("typing", (data) => {
    socket.broadcast
      .in(data.roomNumber)
      .emit("typing", `${data.name} is typing...`);
  });

  socket.on("login", (data) => {
    users.push({
      id: socket.id,
      name: data.nickname,
      roomNumber: data.roomNumber,
    });
    socket.join(data.roomNumber);

    chatNameSpace.emit("online", users);
    console.log(`${data.nickname} connected`);
  });

  socket.on("pvChat", (data) => {
    chatNameSpace.to(data.to).emit("pvChat", data);
  });
});
