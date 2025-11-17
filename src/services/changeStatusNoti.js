const { User } = require("../models/User");
const getFullUserInfo = require("./getFullUserInfor");
const { Noti, STATUS } = require("../models/Noti");
const mongoose = require("mongoose");
const convertNoti = require("../common/utils/convertNoti");

const changeStatusNoti = async (req, res) => {
  try {
    console.log("\nstart-change-status-noti \n"); // In ra console server
    const { id } = req.params;
    const { status } = req.body;
    const notiId = new mongoose.Types.ObjectId(id);
    const statusId = +status;

    const email = req.currentUser.email;
    console.log("email: " + email);
    const user = await User.findOne({ email, status: "ACTIVE" });
    console.log("user: ", user);
    const userId = user._id;

    const noti = await Noti.findById(notiId);

    if (noti.receiverEmail !== email) {
      throw new Error(
        "You are not allowed to change the status of this notification"
      );
    }

    if (!(statusId >= 0 && statusId <= 2)) {
      throw new Error("Status must be between 0 and 2");
    }
    let newStatus;

    if (statusId === 0) newStatus = STATUS.NOT_SEEN;
    else if (statusId === 1) newStatus = STATUS.SEEN;
    else if (statusId === 2) newStatus = STATUS.DELETED;

    noti.status = newStatus;
    if (newStatus === STATUS.SEEN) noti.seenAt = new Date();

    await noti.save();

    return res.json(await convertNoti(noti));
  } catch (error) {
    console.error(error);
    return res.json({
      message: error.message,
      error: error.message,
      success: false,
      status: 500,
    });
  }
};

module.exports = changeStatusNoti;
