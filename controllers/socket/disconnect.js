const redisClient = require("../../redis")
const {
    parseFriendList
} = require("./helpers")
const {handleTimestamp} = require("../../common/handleTimestamp");

module.exports.onDisconnect = async socket => {
    await redisClient.hset(`userid:${socket.user.userid}`, "connected", false, "lastActiveTime", (new Date()).getTime())

    const friendList = await redisClient.lrange(`friends:${socket.user.userid}`, 0, -1)
    const parsedFriendList = await parseFriendList(friendList)
    const friendRooms = parsedFriendList.map(friend => friend.userid)

    socket.to(friendRooms).emit("connected", false, {
        username: socket.user.username,
        ...handleTimestamp()
    })
}