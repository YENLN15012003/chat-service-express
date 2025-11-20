const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
// JWT Secret - nên để trong .env file
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * API JWT Authentication Middleware
 */
const apiAuthMiddleware = (req, res, next) => {
  try {
    // Lấy token từ các nguồn khác nhau
    let token = null;
    const clientIP = getClientIP(req);

    // Cách 1: Từ Authorization header (Bearer token)
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    // Không có token
    if (!token) {
      // console.log('❌ No token provided for API request');

      return res.status(401).json({
        success: false,
        message: "Authentication error: No token provided",
        error: "NO_TOKEN",
      });
    }

    // Verify JWT token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      console.log("token :", token); // Debugging line
      console.log("JWT_SECRET :", JWT_SECRET); // Debugging line

      if (err) {
        console.log("❌ Invalid token:", err.message);
        // Log thất bại
        writeLog({
          ip: clientIP,
          token: token,
          url: `${req.method} ${req.originalUrl || req.url}`,
          body: req.body,
          status: "FAILED",
          error: err.message,
        });
        return res.status(401).json({
          success: false,
          message: "Authentication error: Invalid token",
          error: "INVALID_TOKEN",
          details: err.message,
        });
      }

      // Attach user data to request object
      req.currentUser = decoded;
      req.user = decoded; // Alternative property name

      console.log(`✅ User authenticated: ${JSON.stringify(decoded)}`);
      writeLog({
        ip: clientIP,
        token: token,
        url: `${req.method} ${req.originalUrl || req.url}`,
        body: req.body,
        status: "SUCCESS",
        user: decoded,
      });
      // Continue to next middleware/route handler
      next();
    });
  } catch (error) {
    console.log("❌ Authentication error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Authentication error: " + error.message,
      error: "AUTH_ERROR",
    });
  }
};
const getClientIP = (req) => {
  // Thử lấy từ các header proxy trước
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for có thể chứa nhiều IP, lấy IP đầu tiên
    return forwarded.split(",")[0].trim();
  }

  // Thử các header khác
  return (
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};
const writeLog = (logData) => {
  if (process.env.WRITE_LOG === "0") {
    console.log("Off write log");
    return;
  }
  console.log("start---write---log");
  try {
    // Lấy thư mục root của project (thư mục chứa node_modules)
    const projectRoot = process.cwd();
    const logsDir = path.join(projectRoot, "logs");

    console.log("📁 Logs directory path:", logsDir);

    // Tạo thư mục logs nếu chưa tồn tại
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log("✅ Created logs directory");
    }

    // Tạo tên file theo format log-DD-MM-YYYY.txt
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const fileName = `log-${day}-${month}-${year}.txt`;
    const filePath = path.join(logsDir, fileName);

    console.log("📄 Log file path:", filePath);

    // Tạo log object
    const logEntry = {
      ip: logData.ip,
      token: logData.token,
      url: logData.url,
      body: logData.body,
      timestamp: now.toISOString(),
      localTime: now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    };

    // Thêm các field optional
    if (logData.status) logEntry.status = logData.status;
    if (logData.user) logEntry.user = logData.user;
    if (logData.error) logEntry.error = logData.error;

    // Chuyển thành JSON string và thêm xuống dòng
    const logLine = JSON.stringify(logEntry) + "\n";

    // Ghi vào file (append mode)
    fs.appendFileSync(filePath, logLine, "utf8");

    console.log(`✅ Log written to ${fileName}`);
  } catch (error) {
    console.error("❌ Error writing log:", error.message);
    console.error("❌ Error stack:", error.stack);
  }
};

module.exports = apiAuthMiddleware;
