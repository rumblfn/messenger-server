const redisClient = require("../../redis")

module.exports.acceptConf = async (socket, user) => {
    await redisClient.lpush(`friends:${socket.user.userid}`, [
        user.username, user.userid
    ].join('.'))
    await redisClient.lrem(`friendsExpectation:${socket.user.userid}`, 1, [
        user.username, user.userid, 'outgoing'
    ].join('.'))
    await redisClient.lpush(`friends:${user.userid}`, [
        socket.user.username, socket.user.userid
    ].join('.'))
    await redisClient.lrem(`friendsExpectation:${user.userid}`, 1, [
        socket.user.username, socket.user.userid, 'incoming'
    ].join('.'))

    socket.to(user.userid).emit("add_chat", {
        username: socket.user.username,
        userid: socket.user.userid,
        connected: true
    })

    socket.emit("add_chat", {
        username: user.username,
        userid: user.userid,
        connected: user.connected // connection
    })
}