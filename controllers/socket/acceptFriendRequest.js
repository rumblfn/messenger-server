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

    const cuser = await redisClient.hgetall(`userid:${socket.user.userid}`)
    const friend = await redisClient.hgetall(`userid:${user.userid}`)

    socket.to(user.userid).emit("add_chat", {
        username: socket.user.username,
        userid: socket.user.userid,
        connected: eval(cuser?.connected),
        lastActiveTime: cuser?.lastActiveTime,
        banner: cuser?.banner,
        avatar: cuser?.avatar,
        about: cuser?.about
    })

    socket.emit("add_chat", {
        username: user.username,
        userid: user.userid,
        connected: user.connected,
        lastActiveTime: friend?.lastActiveTime,
        banner: friend?.banner,
        avatar: friend?.avatar,
        about: friend?.about
    })
}