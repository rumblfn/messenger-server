const redisClient = require("../../redis");
const { isEmptyObj, parseFriendList } = require("./helpers");
const {handleTimestamp} = require("../../common/handleTimestamp");

module.exports.initializeUser = async socket => {
    socket.user = {
        ...socket.request.session.user
    };
    socket.join(socket.user.userid)

    await redisClient.hset(
        `userid:${socket.user.userid}`,
        "userid",
        socket.user.userid,
        "connected",
        true,
        "username",
        socket.user.username
    );
    const friendList = await redisClient.lrange(
        `friends:${socket.user.userid}`,
        0,
        -1
    );

    const parsedFriendList = await parseFriendList(friendList)
    const friendRooms = parsedFriendList.map(friend =>
        friend.userid
    )

    if (friendRooms && friendRooms.length) {
        socket.to(friendRooms).emit("connected", true, {
            username: socket.user.username,
            ...handleTimestamp()
        })
    }

    socket.emit("friends", parsedFriendList);

    const unreadOfflineMessagesCounter = await redisClient.hgetall(`userid:${socket.user.userid}:chats`)

    if (!isEmptyObj(unreadOfflineMessagesCounter)) {
        socket.emit('unreadMessages', unreadOfflineMessagesCounter)
    }

    const confirmationsQuery = await redisClient.lrange(`friendsExpectation:${socket.user.userid}`, 0, -1)
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

    const groups = (await redisClient.lrange(`userid:${socket.user.userid}:groups`, 0, -1)) || []
    if (groups.length) {
        const groupsData = []

        for (const groupString of groups) {
            const parsedString = groupString.split('.')
            const unreadMessages = parsedString.pop() || 0
            const groupId = parsedString.pop()

            const groupData = await redisClient.hgetall(`groups:${groupId}`)
            groupsData.push({...groupData, unreadMessages, id: groupId})
        }
        socket.emit('groups', groupsData)
    }
};