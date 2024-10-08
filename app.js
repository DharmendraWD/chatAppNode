const { v4: uuidv4 } = require("uuid");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chatNamespace = io.of("/chat");

// Static Folder
app.use(express.static("public"));

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});

// Setup Websocket
let users = [];
let messages = []; // Array to store all messages

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

  // Handle reactions
  socket.on("react", (data) => {
    chatNameSpace.to(data.roomNumber).emit("reaction", data);
  });

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
    messages.push(data); // Add message to the messages array
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
    messages.push(data); // Add image message to the messages array
    chatNameSpace.to(data.roomNumber).emit("image message", data);
  });

  // -----------------------------------------------------------
  // TYPING INDICATOR LOGIC   TYPING INDICATOR LOGIC    TYPING INDICATOR LOGIC  TYPING INDICATOR LOGIC
  const TYPING_TIMER = 2000; // Time in milliseconds

  chatNameSpace.on("connection", (socket) => {
    let typingTimer;

    // Handle typing notifications
    socket.on("typing", (data) => {
      clearTimeout(typingTimer); // Clear any existing timer

      // Broadcast typing event
      socket.broadcast.emit("typing", data);

      // Set a timer to emit a stop typing event after a delay
      typingTimer = setTimeout(() => {
        socket.broadcast.emit("stop typing", data);
      }, TYPING_TIMER);
    });

    // Handle stop typing notifications
    socket.on("stop typing", (data) => {
      clearTimeout(typingTimer); // Clear any existing timer
      socket.broadcast.emit("stop typing", data);
    });

    // Existing event handlers here
  });
  // TYPING INDICATOR LOGIC END | TYPING INDICATOR LOGIC END 

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

// API routes
app.get('/api/messages', (req, res) => {      //all messages gets here
  res.json(messages);
});

app.get('/api/messages/:roomNumber', (req, res) => {      //all messages of a room wise gets here
  const roomMessages = messages.filter(msg => msg.roomNumber === req.params.roomNumber);
  res.json(roomMessages);
});

app.get('/api/users', (req, res) => {      //all users gets here
  res.json(users);
});

// New API route for joining a room, sending messages, and reacting
app.post('/api/join', express.json(), (req, res) => {
  const { userId, nickname, roomNumber } = req.body;
  
  if (!userId || !nickname || !roomNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const user = {
    id: userId,
    name: nickname,
    roomNumber: roomNumber
  };

  users.push(user);
  chatNameSpace.to(roomNumber).emit('user joined', user);

  res.json({ message: 'Joined successfully', user });
});

app.post('/api/message', express.json(), (req, res) => {
  console.log("received post request");
  const { userId, roomNumber, message } = req.body;

  if (!userId || !roomNumber || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newMessage = {
    messageId: uuidv4(),
    userId,
    roomNumber,
    message,
    date: new Date().toISOString()
  };

  messages.push(newMessage);
  chatNameSpace.to(roomNumber).emit('chat message', newMessage);

  res.json({ message: 'Message sent successfully', newMessage });
});

app.post('/api/react', express.json(), (req, res) => {
  const { userId, messageId, reaction } = req.body;

  if (!userId || !messageId || !reaction) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const message = messages.find(msg => msg.messageId === messageId);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (!message.reactions) {
    message.reactions = [];
  }

  message.reactions.push({ userId, reaction });
  chatNameSpace.to(message.roomNumber).emit('reaction', { messageId, userId, reaction });

  res.json({ message: 'Reaction added successfully' });
});

// ---------------------------------
