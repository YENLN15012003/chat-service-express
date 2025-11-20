const fs = require("fs");
const path = require("path");

/**
 * Lấy IP address từ socket
 */
const getSocketIP = (socket) => {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    socket.handshake.headers["x-real-ip"] ||
    socket.handshake.address ||
    socket.conn.remoteAddress ||
    "unknown"
  );
};

/**
 * Ghi log socket vào file theo ngày
 */
const writeSocketLog = (logData) => {
  if (process.env.WRITE_LOG === "0") {
    console.log("Off write log");
    return;
  }
  console.log("start---write---log");

  try {
    const projectRoot = process.cwd();
    const logsDir = path.join(projectRoot, "logs", "socket");

    // Tạo thư mục logs/socket nếu chưa tồn tại
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log("✅ Created socket logs directory");
    }

    // Tạo tên file theo format socket-log-DD-MM-YYYY.txt
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const fileName = `socket-log-${day}-${month}-${year}.txt`;
    const filePath = path.join(logsDir, fileName);

    // Tạo log object
    const logEntry = {
      ip: logData.ip,
      socketId: logData.socketId,
      event: logData.event,
      data: logData.data,
      timestamp: now.toISOString(),
      localTime: now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    };

    // Thêm các field optional
    if (logData.status) logEntry.status = logData.status;
    if (logData.user) logEntry.user = logData.user;
    if (logData.error) logEntry.error = logData.error;
    if (logData.room) logEntry.room = logData.room;

    // Chuyển thành JSON string và thêm xuống dòng
    const logLine = JSON.stringify(logEntry) + "\n";

    // Ghi vào file (append mode)
    fs.appendFileSync(filePath, logLine, "utf8");
  } catch (error) {
    console.error("❌ Error writing socket log:", error.message);
  }
};

/**
 * Helper function để wrap socket handlers với logging
 */
const wrapSocketHandler = (socket, event, handler, clientIP) => {
  return function (...args) {
    // Log incoming event với data
    writeSocketLog({
      ip: clientIP,
      socketId: socket.id,
      event: event,
      data: args.length > 0 ? args : undefined,
      status: "RECEIVED",
      user: socket.currentUser,
    });

    // Gọi handler gốc
    try {
      const result = handler.apply(this, args);

      // Nếu handler return promise, catch error
      if (result && typeof result.then === "function") {
        return result.catch((error) => {
          writeSocketLog({
            ip: clientIP,
            socketId: socket.id,
            event: event,
            data: args.length > 0 ? args : undefined,
            status: "ERROR",
            error: error.message,
            user: socket.currentUser,
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      // Log nếu handler bị lỗi
      writeSocketLog({
        ip: clientIP,
        socketId: socket.id,
        event: event,
        data: args.length > 0 ? args : undefined,
        status: "ERROR",
        error: error.message,
        user: socket.currentUser,
      });
      throw error;
    }
  };
};

/**
 * Middleware để log tất cả socket events
 */
const socketLoggerMiddleware = (socket, next) => {
  const clientIP = getSocketIP(socket);

  // Log khi connection thành công
  writeSocketLog({
    ip: clientIP,
    socketId: socket.id,
    event: "connection",
    data: {
      headers: socket.handshake.headers,
      query: socket.handshake.query,
    },
    status: "SUCCESS",
    user: socket.currentUser,
  });

  // Wrap socket.on để log tất cả events TRƯỚC KHI handler được gọi
  const originalOn = socket.on.bind(socket);
  socket.on = function (event, handler) {
    // Wrap handler với logging
    const wrappedHandler = wrapSocketHandler(socket, event, handler, clientIP);
    // Đăng ký handler đã được wrap
    return originalOn(event, wrappedHandler);
  };

  // Wrap socket.emit để log outgoing events
  const originalEmit = socket.emit.bind(socket);
  socket.emit = function (event, ...args) {
    // Không log các internal events của socket.io
    if (
      !event.startsWith("$") &&
      event !== "newListener" &&
      event !== "removeListener"
    ) {
      writeSocketLog({
        ip: clientIP,
        socketId: socket.id,
        event: event,
        data: args.length > 0 ? args : undefined,
        status: "SENT",
        user: socket.currentUser,
      });
    }
    return originalEmit(event, ...args);
  };

  next();
};

module.exports = { socketLoggerMiddleware, writeSocketLog, getSocketIP };
