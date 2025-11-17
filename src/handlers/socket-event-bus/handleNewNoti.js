const { User } = require("../../models/User");
const convertNoti = require("../../common/utils/convertNoti");

const handleNewNoti = async (message) => {
  console.log("emit new noti   .....");
  console.log("message: " + JSON.stringify(message, null, 2));

  const user = await User.findOne({ email: message.receiverEmail });
  const userId = user._id;
  global.io.to(userId.toString()).emit("receive_noti", convertNoti(message));

  console.log("emit new noti success.....");
};
module.exports = handleNewNoti;
