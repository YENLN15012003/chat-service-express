// welcomeMiddleware.js
module.exports = {
  http: (req, res, next) => {
    console.log("[WELCOME] New HTTP request →", req.method, req.url);
    next();
  },

  socket: (socket, next) => {
    console.log("[WELCOME] New Socket connection →", socket.id);
    next();
  }
};
