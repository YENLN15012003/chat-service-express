// welcomeMiddleware.js
const log = {
  http: (req, res, next) => {
    console.log("[WELCOME] New HTTP request →", req.method, req.url);
    next();
  },

  socket: (socket, next) => {
    console.log("[WELCOME] New Socket connection →", socket.id);
    next();
  },
};
module.exports = log;
