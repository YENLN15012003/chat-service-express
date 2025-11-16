const SynchronizePublisher = require("../messageBroker/synchronizePublisher");
const { User } = require("../models/User");

const pingOnlineJob = () => {
  setInterval(async () => {
    try {
      // Lấy tất cả socket đang kết nối
      const sockets = await global.io.fetchSockets();
      console.log(`Đang có ${sockets.length} socket online`);
      const users = await User.find();
      const response = {};
      const redis = await SynchronizePublisher.getInstance();
      for (let i = 0; i < users.length; i++) {
        const email = users[i].email;
        const key = "last_online_" + email;
        const lastOnline = await redis.getValue(key);
        response[email] = lastOnline;
      }
      // Gửi event tới tất cả socket
      sockets.forEach((socket) => {
        socket.emit("receive_last_online_info", response);
      });
    } catch (err) {
      console.error("Lỗi khi gửi broadcast:", err);
    }
  }, 20000); // 20 giây
};

module.exports = pingOnlineJob;
