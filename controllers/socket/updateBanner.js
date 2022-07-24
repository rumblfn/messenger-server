const redisClient = require("../../redis");

module.exports.updateBanner = async (socket, filename) => {
    const friendList = await redisClient.lrange(
        `friends:${socket.user.userid}`,
        0,
        -1
    );

    const friendRooms = friendList.map(friend => {
        const parsedFriend = friend.split('.')
        return parsedFriend.pop()
    })

    if (friendRooms && friendRooms.length) {
        socket.to(friendRooms).emit("banner-changed", filename, socket.user.username)
    }
}