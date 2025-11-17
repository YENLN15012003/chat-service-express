const { User } = require("../models/User");
const { Noti, STATUS } = require("../models/Noti");
const convertNoti = require("../common/utils/convertNoti");
const getNotification = async (req, res) => {
  try {
    console.log("\nstart-get-list-noti \n"); // In ra console server
    const { pageSize, currentPage } = req.query;

    const email = req.currentUser.email;
    console.log("email: " + email);

    const user = await User.findOne({ email, status: "ACTIVE" });
    console.log("user: ", user);
    const userId = user._id;

    const skip = +currentPage * +pageSize;

    const countNotSeen = await Noti.countDocuments({
      receiverEmail: email,
      status: STATUS.NOT_SEEN,
    });
    const notifications = await Noti.find({
      receiverEmail: email,
      status: {
        $ne: STATUS.DELETED,
      },
    }).sort({ createdAt: -1 });

    console.log("notifications is : ", notifications);

    const notificationPromises = notifications
      .slice(skip, Math.min(skip + pageSize, notifications.length))
      .map(async (noti) => await convertNoti(noti));

    const records = await Promise.all(notificationPromises);
    const totalItems = +notifications.length;

    return res.json({
      success: true,
      message: "success",
      status: 200,
      data: {
        notSeenNotificationNums: countNotSeen,
        paginationInfo: {
          pagination: {
            currentPage: +currentPage,
            pageSize: +pageSize,
            totalItems,
            totalPages: +Math.ceil(totalItems / +pageSize),
          },
          records,
        },
      },
    });
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

module.exports = getNotification;
