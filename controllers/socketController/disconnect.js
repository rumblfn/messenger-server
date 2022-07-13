const redisClient = require("../../redis")
const { parseFriendList } = require("./helpers")

module.exports.onDisconnect = async socket => {
    await redisClient.hset(`userid:${socket.user.username}`, "connected", false)

    const friendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1)
    const parsedFriendList = await parseFriendList(friendList)
    const friendRooms = parsedFriendList.map(friend => friend.userid)

    socket.to(friendRooms).emit("connected", false, socket.user.username)
}