const testHandler = require("./testHandler");
const socketAuthMiddleware = require("../../middleware/socketAuth");
const joinRoom = require("../../common/utils/join-room");
const { createAdapter } = require("@socket.io/redis-adapter");
const sendMessageHandler = require("./sendMessageHandler");
const pingOnlineHandler = require("./pingOnlineHandler");
const typing = require("./typing");
const {
  socketLoggerMiddleware,
  writeSocketLog,
  getSocketIP,
} = require("../../middleware/log-socket");

// TOUCH IT WHEN YOU ADD NEW HANDLER
const HANDLERS = [
  testHandler,
  sendMessageHandler,
  pingOnlineHandler,
  typing,
  // Thêm vào array này khi có handler mới
];
// const ROOMS = [
//   // Thêm vào array này khi muon room mới
//   "indentity",
// ];

// DON'T TOUCH
const clientSocketHandler = async (io, socketEventBus) => {
  console.log("Setting up Socket.IO handlers...");
  console.log("Redis URL = ", process.env.REDIS_URL);

  io.use(socketAuthMiddleware);
  console.log("✅ Socket.IO auth middleware applied");
  io.use(socketLoggerMiddleware);

  io.adapter(createAdapter(socketEventBus.pubClient, socketEventBus.subClient));
  console.log("✅ Socket.IO Redis adapter configured");

  io.on("connection", (socket) => {
    console.log("One user connected:", socket.id);
    const clientIP = getSocketIP(socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

    HANDLERS.forEach((handler, index) => {
      if (typeof handler === "function") {
        handler(socket, socketEventBus);
        console.log(
          `🔧 Applied handler ${index + 1}/${HANDLERS.length} - ${
            handler.name || "anonymous"
          }`
        );
      }
    });

    // ROOMS.forEach((room) => {
    //   const currentUser = socket.currentUser;
    //   const specificRoom = `${room}_${currentUser.id}`;
    //   joinRoom(socket, specificRoom);
    // });
    const currentUser = socket.currentUser;
    const specificRoom = currentUser.user._id.toString();
    joinRoom(socket, specificRoom);
    // Log join room
    writeSocketLog({
      ip: clientIP,
      socketId: socket.id,
      event: "join_room",
      data: {},
      status: "SUCCESS",
      user: socket.currentUser,
      room: specificRoom,
    });
  });

  io.engine.on("connection_error", (err) => {
    console.log("🚫 Connection error:", err.req);
    console.log("🚫 Error code:", err.code);
    console.log("🚫 Error message:", err.message);
    console.log("🚫 Error context:", err.context);
    writeSocketLog({
      ip: err.req?.headers?.["x-forwarded-for"] || "unknown",
      socketId: "N/A",
      event: "connection_error",
      data: {
        code: err.code,
        message: err.message,
        context: err.context,
      },
      status: "ERROR",
      error: err.message,
    });
  });
};

module.exports = { clientSocketHandler };
