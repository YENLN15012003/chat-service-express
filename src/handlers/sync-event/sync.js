const syncConversation = require("./syncConversation");
const syncUpdateUser = require("./syncUpdateUser");
const syncUser = require("./syncUser");
const syncSendMessage = require("./syncSendMessage");
const syncNoti = require("./syncNoti");

const sync = async (message) => {
  try {
    const { eventType, ...data } = message;
    const socketEventBus = await require("../socket-event-bus").getInstance();
    switch (eventType) {
      case "SYNC_USER":
        await syncUser(data);
        break;

      case "SYNC_UPDATE_USER":
        await syncUpdateUser(data);
        break;

      case "SYNC_CONVERSATION":
        await syncConversation(data);
        break;

      case "SYNC_SEND_MESSAGE":
        await syncSendMessage(data);
        break;

      case "TEST":
        console.log("WOWWWWWWWW____TESTTTTTTT: ", data);
        break;

      case "RECEIVE_FRIEND_REQUEST":
        await socketEventBus.publish("RECEIVE_FRIEND_REQUEST", data);
        break;

      case "CANCEL_FRIEND_REQUEST":
        await socketEventBus.publish("CANCEL_FRIEND_REQUEST", data);
        break;

      case "DELETE_FRIEND":
        await socketEventBus.publish("DELETE_FRIEND", data);
        break;

      case "REJECT_FRIEND_REQUEST":
        await socketEventBus.publish("REJECT_FRIEND_REQUEST", data);
        break;

      case "ACCEPT_FRIEND_REQUEST":
        await socketEventBus.publish("ACCEPT_FRIEND_REQUEST", data);
        break;

      case "NOTI":
        await syncNoti(data);
        break;

      case "NEW_NOTI":
        await socketEventBus.publish("NEW_NOTI", data);
        break;

      default:
        console.log("NOT FOUND CURRENT EVENT TYPE: " + eventType);
    }

    console.log("📥 sync successfully:");
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = sync;
