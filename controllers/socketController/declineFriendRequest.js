const redisClient = require("../../redis")

module.exports.declineConf = async (socket, user) => {
    await redisClient.lrem(`friendsExpectation:${socket.user.username}`, 1, [
        user.username, user.userid, user.type
    ].join('.'))
    await redisClient.lrem(`friendsExpectation:${user.username}`, 1, [
        socket.user.username, socket.user.userid, user.type === 'incoming' ? 'outgoing' : 'incoming'
    ].join('.'))

    socket.to(user.userid).emit("remove_confirmation", socket.user.username)
}