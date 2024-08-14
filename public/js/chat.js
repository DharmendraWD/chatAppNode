const chatNamespace = io("/chat", {
  auth: {
    token: 123456,
  },
});

// Query DOM
const messageInput = document.getElementById("messageInput");
const chatForm = document.getElementById("chatForm");
const chatBox = document.getElementById("chat-box");
const feedback = document.getElementById("feedback");
const onlineUsers = document.getElementById("online-users-list");
const chatContainer = document.getElementById("chatContainer");
const pvChatForm = document.getElementById("pvChatForm");
const pvMessageInput = document.getElementById("pvMessageInput");
const modalTitle = document.getElementById("modalTitle");
const pvChatMessage = document.getElementById("pvChatMessage");
const imageInput = document.getElementById("imageInput");
const sendImageButton = document.getElementById("sendImageButton");

let replyToMessageId = null;
let replyToMessageContent = "";
let replyToMessageImage = "";

const nickname = localStorage.getItem("nickname");
const roomNumber = localStorage.getItem("chatroom");
let socketId;

// Emit Events
chatNamespace.emit("login", { nickname, roomNumber });

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (messageInput.value) {
    chatNamespace.emit("chat message", {
      message: messageInput.value,
      nickname,
      roomNumber,
      replyTo: replyToMessageId,
      replyContent: replyToMessageContent,
      replyImage: replyToMessageImage,
    });
    messageInput.value = "";
    replyToMessageId = null; // Reset reply after sending
    replyToMessageContent = ""; // Reset reply content
    replyToMessageImage = ""; // Reset reply image
  }
});

sendImageButton.addEventListener("click", () => {
  imageInput.click(); // Trigger the file input click
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      chatNamespace.emit("sendImage", {
        image: event.target.result,
        name: file.name,
        nickname,
        roomNumber,
        replyTo: replyToMessageId,
        replyContent: replyToMessageContent,
        replyImage: replyToMessageImage,
      });
    };
    reader.readAsDataURL(file); // Convert image to base64
  }
});

pvChatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  chatNamespace.emit("pvChat", {
    message: pvMessageInput.value,
    name: nickname,
    to: socketId,
    from: chatNamespace.id,
  });
  $("#pvChat").modal("hide");
  pvMessageInput.value = "";
});

// Listening
chatNamespace.on("chat message", (data) => {
  feedback.innerHTML = "";
  const replyTag = data.replyTo
    ? `<div class="replyBg">
          <strong>Replying to:
       <i class="ri-chat-1-line"></i>
          </strong>
          ${
            data.replyImage
              ? `<img src="${data.replyImage}" alt="reply image" style="max-width: 50px; max-height: 50px; margin-right: 10px;" />`
              : data.replyContent
          }



          </div>`
    : "";
  chatBox.innerHTML += `<li class="alert msgBox" data-message-id="${data.messageId}">
                            <span class="nameDateBg whiteClr font-weight-normal" style="font-size: 14pt">
                            <i class="ri-user-line"></i>
                            ${data.nickname}
                            <span class="whiteClr font-italic font-weight-light m-2" style="font-size: 11pt">${data.date} 
                            <i class="ri-time-line"></i>
                            </span>
                            </span>
                            ${replyTag}
                            <p class=" pzero message-content" style="font-family:  "Dosis", sans-serif">
                            <i class="ri-chat-3-line"></i>
                            ${data.message}</p>
                            <button class="btn d-flex btn-outline-secondary btn-sm replyBtn" data-message-id="${data.messageId}" data-reply-content="${data.message}">Reply <i class="ri-reply-line"></i> </button>
                          </li>`;
  chatContainer.scrollTop =
    chatContainer.scrollHeight - chatContainer.clientHeight;

  // Add event listeners to reply buttons
  document.querySelectorAll(".replyBtn").forEach((button) => {
    button.addEventListener("click", (e) => {
      replyToMessageId = button.getAttribute("data-message-id");
      replyToMessageContent = button.getAttribute("data-reply-content"); // Correctly fetch the content to reply to
      replyToMessageImage =
        button.closest("li").querySelector("img")?.src || ""; // Get the image src if available
      messageInput.focus();
    });
  });
});

chatNamespace.on("image message", (data) => {
  feedback.innerHTML = "";
  const replyTag = data.replyTo
    ? `<div class="alert alert-secondary">
          <strong class="replyto">Replying to:</strong>
          ${
            data.replyImage
              ? `<img src="${data.replyImage}" alt="reply image" style="max-width: 50px; max-height: 50px; margin-right: 10px;" />`
              : data.replyContent
          }
      
      </div>`
    : "";
  chatBox.innerHTML += `<li class="alert msgBox" data-message-id="${data.messageId}">
                            <span class="whiteClr nameDateBg  font-weight-normal" style="font-size: 13pt">
                            <i class="ri-user-line"></i>
                            
                            ${data.nickname}
                            <span class="whiteClr font-italic font-weight-light m-2" style="font-size: 9pt">${data.date} 
                            <i class="ri-time-line"></i>
                            </span>
                            </span>
                            ${replyTag}
                            <img src="${data.image}" alt="${data.name}" style="max-width: 20%; max-height: 200px;" />
                            <button class="btn d-flex btn-outline-secondary btn-sm replyBtn" data-message-id="${data.messageId}" data-reply-content="${data.message}">Reply <i class="ri-reply-line"></i> </button>

                          </li>`;
  chatContainer.scrollTop =
    chatContainer.scrollHeight - chatContainer.clientHeight;

  // Add event listeners to reply buttons
  document.querySelectorAll(".replyBtn").forEach((button) => {
    button.addEventListener("click", (e) => {
      replyToMessageId = button.getAttribute("data-message-id");
      replyToMessageContent = button.getAttribute("data-reply-content"); // Correctly fetch the content to reply to
      replyToMessageImage =
        button.closest("li").querySelector("img")?.src || ""; // Get the image src if available
      messageInput.focus();
    });
  });
});

messageInput.addEventListener("keypress", () => {
  chatNamespace.emit("typing", { name: nickname, roomNumber });
});

chatNamespace.on("typing", (data) => {
  if (roomNumber === data.roomNumber) {
    feedback.innerHTML = data;
  }
});

chatNamespace.on("pvChat", (data) => {
  $("#pvChat").modal("show");
  socketId = data.from;
  modalTitle.innerHTML = "Received message from " + data.name;
  pvChatMessage.style.display = "block";
  pvChatMessage.innerHTML = data.name + " : " + data.message;
});

chatNamespace.on("online", (data) => {
  onlineUsers.innerHTML = "";
  data.forEach((user) => {
    if (roomNumber === user.roomNumber) {
      onlineUsers.innerHTML += `
            <li>
              <button type="button" class="btn btn-light upperOnUser mx-2" data-toggle="modal" data-target="#pvChat" data-id="${
                user.id
              }" data-client="${user.name}" ${
        user.id === chatNamespace.id ? "disabled" : ""
      }>
                ${user.name}
                <span class="badge badge-success"></span>
              </button>
            </li>
        `;
    }
  });
});

// jQuery
$("#pvChat").on("show.bs.modal", function (e) {
  const button = $(e.relatedTarget);
  const user = button.data("client");
  socketId = button.data("id");

  modalTitle.innerHTML = "Send message to " + user;
  pvChatMessage.style.display = "none";
});
