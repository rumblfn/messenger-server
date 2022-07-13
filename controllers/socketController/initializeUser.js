const redisClient = require("../../redis");
const { isEmptyObj, parseFriendList } = require("./helpers");

module.exports.initializeUser = async socket => {
    socket.user = {
        ...socket.request.session.user
    };
    socket.join(socket.user.userid)

    await redisClient.hset(
        `userid:${socket.user.username}`,
        "userid",
        socket.user.userid,
        "connected",
        true
    );
    const friendList = await redisClient.lrange(
        `friends:${socket.user.username}`,
        0,
        -1
    );

    const parsedFriendList = await parseFriendList(friendList)
    const friendRooms = parsedFriendList.map(friend =>
        friend.userid
    )

    if (friendRooms && friendRooms.length) {
        socket.to(friendRooms).emit("connected", true, socket.user.username)
    }

    socket.emit("friends", parsedFriendList);

    const msgQuery = await redisClient.lrange(`chat:${socket.user.userid}`, 0, -1)

    const messages = msgQuery.map(msgString => {
        const parsedStr = msgString.split(".")
        return {
            to: parsedStr.shift(),
            from: parsedStr.shift(),
            content: parsedStr.join(".")
        }
    })

    if (messages && messages.length) {
        socket.emit("messages", messages)
    }

    const unreadOfflineMessagesCounter = await redisClient.hgetall(`userid:${socket.user.username}:chats`)

    if (!isEmptyObj(unreadOfflineMessagesCounter)) {
        socket.emit('unreadMessages', unreadOfflineMessagesCounter)
    }

    const confirmationsQuery = await redisClient.lrange(`friendsExpectation:${socket.user.username}`, 0, -1)
    const confirmations = confirmationsQuery.map(confirmationString => {
        const parsedStr = confirmationString.split('.')
        return {
            type: parsedStr.pop(),
            userid: parsedStr.pop(),
            username: parsedStr.join(".")
        }
    })

    if (confirmations && confirmations.length) {
        socket.emit('confirmations', confirmations)
    }
};