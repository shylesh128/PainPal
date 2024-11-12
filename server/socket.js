const socketIo = require("socket.io");
const cookie = require("cookie");
const User = require("./models/userModel");
const jwt = require("jsonwebtoken");
const Message = require("./models/messageModel");
const connectionModel = require("./models/connectionModel");
const authenticateSocket = require("./middlewares/authenticateSocket");
const ChatMessage = require("./models/ChatMessage");
const secretKey =
  "746d3de964867c223d8a97948f22987e66566d7b73e65f0b23221ac8174b986e";

module.exports = (httpServer) => {
  const io = socketIo(httpServer);

  const activePairs = [];
  const activeUsers = new Map();
  const marvelCharacters = [];

  io.of("/api/chat").on("connection", async (socket) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      const parsedCookies = cookies ? cookie.parse(cookies) : {};
      const userCookie = parsedCookies.pain;

      if (!userCookie) {
        console.log("User disconnected because username is undefined");
        socket.disconnect(true);
        return;
      }

      const decoded = jwt.verify(userCookie, secretKey);
      const user = await User.findById(decoded.userId);

      let userId = user.name;
      let socketId = socket.id;

      // Disconnect the old socket if the user is already connected
      if (isUserAlreadyConnected(userId)) {
        console.log(
          `User ${userId} is already connected. Disconnecting old connection.`
        );
        const existingSocketId = getExistingSocketId(userId);

        // Check if the socket with the existingSocketId exists before disconnecting
        const existingSocket = io.of("/api/chat").sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        } else {
          console.log(`Socket with id ${existingSocketId} not found.`);
        }
      }

      // Create or add to a pair based on the current state
      if (
        activePairs.length === 0 ||
        activePairs[activePairs.length - 1].length === 2
      ) {
        activePairs.push([socketId]);
      } else {
        activePairs[activePairs.length - 1].push(socketId);
      }

      let currentPair = activePairs[activePairs.length - 1];

      socket.on("get active users", (callback) => {
        callback(Array.from(activeUsers.values()));
      });

      activeUsers.set(socketId, userId);
      console.log(`${userId} connected to chat in pair ${activePairs.length}`);

      const newConnection = await connectionModel.create({
        username: userId,
        timeStamp: new Date().toISOString(),
        text: "Connected to chat",
        pair: activePairs.length,
      });

      io.of("/api/chat").emit("update users", Array.from(activeUsers.values()));

      socket.on("disconnect", () => {
        console.log(`${userId} disconnected from chat`);

        // Check if the user is in the activeUsers map before deleting
        if (activeUsers.has(socketId)) {
          activeUsers.delete(socketId);
        }

        // Remove the user from the current pair
        const index = currentPair.indexOf(socketId);
        if (index !== -1) {
          currentPair.splice(index, 1);
        }

        marvelCharacters.push(userId);
        io.of("/api/chat").emit(
          "update users",
          Array.from(activeUsers.values())
        );
      });

      socket.on("chat message", async (data) => {
        const timestamp = new Date().toISOString();

        // Save the message to the database
        const message = new Message({
          username: data.userId,
          timeStamp: timestamp,
          text: data.msg,
          pair: activePairs.length,
          to: getReceiverUsername(currentPair, socketId),
        });

        try {
          await message.save();
        } catch (error) {
          console.error("Error saving message to the database:", error.message);
        }

        // Broadcast the message to all members of the current pair
        currentPair.forEach((memberSocketId) => {
          io.of("/api/chat").to(memberSocketId).emit("chat message", {
            userId: data.userId,
            msg: data.msg,
            timestamp,
          });
        });
      });
    } catch (error) {
      console.error("Error during socket connection:", error.message);
      // Handle the error as needed
    }
  });

  function getReceiverUsername(pair, senderSocketId) {
    const receiverSocketId = pair.find(
      (socketId) => socketId !== senderSocketId
    );
    return activeUsers.get(receiverSocketId) || "Unknown";
  }

  function isUserAlreadyConnected(username) {
    return Array.from(activeUsers.values()).includes(username);
  }

  function getExistingSocketId(username) {
    for (const [existingSocketId, existingUsername] of activeUsers) {
      if (existingUsername === username) {
        return existingSocketId;
      }
    }
    return null;
  }

  const globalNamespace = io.of("/api/chat/global");
  const globals = {}; // Store multiple global rooms and their users
  const MAX_USERS = 50;

  globalNamespace.use(authenticateSocket);

  globalNamespace.on("connection", async (socket) => {
    try {
      const user = socket.user;
      const userId = user._id.toString();
      const socketId = socket.id;

      let currentGlobalId;

      // If the user has already been assigned a global chat room
      if (user.globalId && globals[user.globalId]) {
        currentGlobalId = user.globalId;
      } else {
        // Find a global room with available space
        let assigned = false;
        for (const globalId in globals) {
          if (globals[globalId].length < MAX_USERS) {
            currentGlobalId = globalId;
            globals[globalId].push({ userId, name: user.name, socketId });
            assigned = true;
            break;
          }
        }

        // If no room with available space, create a new global room
        if (!assigned) {
          currentGlobalId = `global-${Date.now()}`;
          globals[currentGlobalId] = [{ userId, name: user.name, socketId }];
        }

        // Update user document with the assigned globalId
        user.globalId = currentGlobalId;
        await user.save();
      }

      // Emit the updated user count for the specific global room
      globalNamespace.emit("userCount", globals[currentGlobalId].length);

      socket.join(currentGlobalId);

      socket.on("message", (msg) => {
        globalNamespace.to(currentGlobalId).emit("message", {
          user: user.name,
          text: msg,
          time: new Date(),
        });
      });

      socket.on("disconnect", async () => {
        // Remove the user from the global room
        const globalRoom = globals[currentGlobalId];
        const userIndex = globalRoom.findIndex(
          (user) => user.socketId === socketId
        );

        if (userIndex > -1) {
          globalRoom.splice(userIndex, 1); // Remove user from room
          globalNamespace
            .to(currentGlobalId)
            .emit("userCount", globalRoom.length);

          // If user was the last in the global room, delete the room
          if (globalRoom.length === 0) {
            delete globals[currentGlobalId];
          }
        }

        // Optionally, clear the globalId from the user document if they disconnect
        if (user.globalId === socketId) {
          user.globalId = null;
          await user.save();
        }
      });
    } catch (error) {
      console.error("Error during socket connection:", error.message);
      socket.emit("error", { message: "Connection error." });
      socket.disconnect();
    }
  });

  return io;
};
