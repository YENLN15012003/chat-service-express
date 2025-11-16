const { createClient } = require("redis");
const handleSendMessageToReceiver = require("./handleSendMessageToReceiver");
const handleSendSeenStatusToReceiver = require("./handleSendSeenStatusToReceiver");

const handleSendNotiReceiveFRForMuti = require("./handleSendNotiReceiveFRForMuti");
const handleSendNotiRejectFRForMuti = require("./handleSendNotiRejectFRForMuti");
const handleSendNotiCancelFRForMuti = require("./handleSendNotiCancelFRForMuti");
const handleSendNotiRemoveFriendForMuti = require("./handleSendNotiRemoveFriendForMuti");
const handleSendNotiAcceptFRForMuti = require("./handleSendNotiAcceptFRForMuti");
const handleSendNotiCreateGroupForMuti = require("./handleSendNotiCreateGroupForMuti");
const handleSendNotiAddMemberGroupForMuti = require("./handleSendNotiAddMemberGroupForMuti");
const handleSendNotiDeleteMemberGroupForMuti = require("./handleSendNotiDeleteMemberGroupForMuti");
const handleSendNotiLeaveGroupForMuti = require("./handleSendNotiLeaveGroupForMuti");
const handleSendNotiDeleteConversationForMuti = require("./handleSendNotiDeleteConversationForMuti");
const handleTyping = require("./handleTyping");
const handleNewReaction = require("./handleNewReaction");

// DON'T TOUCH
class SocketEventBus {
  constructor(pubClient, subClient) {
    this.pubClient = pubClient;
    this.subClient = subClient;
  }

  static instance = null;

  static async getInstance() {
    console.log("Initializing SocketEventBus...");

    if (SocketEventBus.instance) {
      console.log("Returning existing SocketEventBus instance");
      return SocketEventBus.instance;
    }

    const pubClient = createClient({
      url: process.env.REDIS_URL,
    });

    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();
    console.log("✅ Redis clients connected successfully");

    const socketEventBus = new SocketEventBus(pubClient, subClient);

    socketEventBus.subcribe();

    SocketEventBus.instance = socketEventBus;

    return socketEventBus;
  }

  async publish(event, data) {
    if (!this.pubClient) {
      throw new Error("Redis publisher client is not connected.");
    }
    if (!event || !data) {
      throw new Error(
        "event, data are required, this is those values: ",
        event + " " + data
      );
    }

    await this.pubClient.publish(event, JSON.stringify(data));

    console.log(`Published event '${event}' with data:`, data);
  }

  subcribe() {
    // send message to receiver
    this.subClient.subscribe(
      "emit_message_for_multi_receiver_in_multi_device",
      async (message) => {
        await handleSendMessageToReceiver(JSON.parse(message));
      }
    );

    this.subClient.subscribe(
      "emit_seen_status_for_multi_receiver_in_multi_device",
      async (message) => {
        await handleSendSeenStatusToReceiver(JSON.parse(message));
      }
    );
    this.subClient.subscribe("RECEIVE_FRIEND_REQUEST", async (message) => {
      await handleSendNotiReceiveFRForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("CANCEL_FRIEND_REQUEST", async (message) => {
      await handleSendNotiCancelFRForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("DELETE_FRIEND", async (message) => {
      await handleSendNotiRemoveFriendForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("REJECT_FRIEND_REQUEST", async (message) => {
      await handleSendNotiRejectFRForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("ACCEPT_FRIEND_REQUEST", async (message) => {
      await handleSendNotiAcceptFRForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("CREATE_GROUP", async (message) => {
      await handleSendNotiCreateGroupForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("ADD_MEMBER_TO_GROUP", async (message) => {
      await handleSendNotiAddMemberGroupForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("DELETE_MEMBER_FROM_GROUP", async (message) => {
      await handleSendNotiDeleteMemberGroupForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("LEAVE_GROUP", async (message) => {
      await handleSendNotiLeaveGroupForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("DELETE_CONVERSATION", async (message) => {
      await handleSendNotiDeleteConversationForMuti(JSON.parse(message));
    });
    this.subClient.subscribe("TYPING", async (message) => {
      await handleTyping(JSON.parse(message));
    });
    this.subClient.subscribe("NEW_REACTION", async (message) => {
      await handleNewReaction(JSON.parse(message));
    });
  }
}

module.exports = SocketEventBus;
