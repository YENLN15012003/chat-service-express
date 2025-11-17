const getFullUserInfo = require("../../services/getFullUserInfor");

const convertNoti = async (noti) => {
  const userReferenceEmail = noti.referenceEmail;
  const userReference = await getFullUserInfo(userReferenceEmail);
  console.log("ssssss: ", userReference);
  return {
    id: noti._id,
    content: noti.content,
    status: noti.status,
    type: noti.type,
    createdAt: noti.createdAt,
    seenAt: noti.seenAt,
    userReference,
  };
};

module.exports = convertNoti;
