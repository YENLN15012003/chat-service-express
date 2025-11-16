const { User } = require("../../models/User");
const genPresignURL = require("../../services/genPresignURL");
const { REACTION } = require("../../models/Message");

const convertMessageToLongFormat = async (message, userId) => {
  if (!message) return null;

  const [sender, attachments] = await Promise.all([
    User.findOne(message.senderId),
    getFullInfoAttachment(message.attachments),
  ]);
  if (!sender) throw new Error("NOT FOUND SENDER WITH ID: ", message.senderId);

  const [images, videos, files] = attachments;

  const like = [],
    dislike = [],
    heart = [];

  const senderReact = {
    messageId: message._id,
    userId: message.senderId,
    createdAt: message.reactedAt,
    updatedAt: message.reactedAt,
  };

  let isILike = 0;
  let isIDislike = 0;
  let isIHeart = 0;

  if (message.reaction === REACTION.LIKE) {
    senderReact.type = "like";
    like.push(senderReact);
    if (message.senderId.toString() === userId.toString()) isILike = 1;
  } else if (message.reaction === REACTION.DISLIKE) {
    senderReact.type = "dislike";
    dislike.push(senderReact);
    if (message.senderId.toString() === userId.toString()) isIDislike = 1;
  } else if (message.reaction === REACTION.TYM) {
    senderReact.type = "heart";
    heart.push(senderReact);
    if (message.senderId.toString() === userId.toString()) isIHeart = 1;
  }

  message.recipients.forEach((recipient) => {
    const receiveReact = {
      messageId: message._id,
      userId: recipient.userId,
      createdAt: recipient.reactedAt,
      updatedAt: recipient.reactedAt,
    };
    if (recipient.reaction === REACTION.LIKE) {
      receiveReact.type = "like";
      like.push(receiveReact);
      if (recipient.userId.toString() === userId.toString()) isILike = 1;
    } else if (recipient.reaction === REACTION.DISLIKE) {
      receiveReact.type = "dislike";
      dislike.push(receiveReact);
      if (recipient.userId.toString() === userId.toString()) isIDislike = 1;
    } else if (recipient.reaction === REACTION.TYM) {
      receiveReact.type = "heart";
      heart.push(receiveReact);
      if (recipient.userId.toString() === userId.toString()) isIHeart = 1;
    }
  });

  return {
    sender: {
      _id: sender._id,
      fullName: sender.fullName,
      email: sender.email,
      profilePic: await genPresignURL(sender.avatar),
    },
    message: {
      _id: message._id,
      replyForMessgeId: message.replyForMessgeId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      type: message.type,
      attachments: {
        images,
        videos,
        files,
      },
    },
    reactions: {
      // 100 % data nay, khong can query
      total: {
        like,
        dislike,
        heart,
      },
      my: {
        like: isILike,
        dislike: isIDislike,
        heart: isIHeart,
      },
    },
  };
};

const getFullInfoAttachment = async (attachments) => {
  const images = [],
    videos = [],
    files = [];
  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    attachment._doc.presignURL = await genPresignURL(attachment.key);

    if (
      attachment.contentType === "image/jpeg" ||
      attachment.contentType === "image/jpg" ||
      attachment.contentType === "image/png" ||
      attachment.contentType === "image/gif" ||
      attachment.contentType === "image/webp"
    ) {
      images.push(attachment);
    } else if (
      attachment.contentType === "video/mp4" ||
      attachment.contentType === "video/quicktime" ||
      attachment.contentType === "video/x-msvideo" ||
      attachment.contentType === "video/webm"
    ) {
      videos.push(attachment);
    } else files.push(attachment);
  }
  return [images, videos, files];
};

module.exports = convertMessageToLongFormat;
