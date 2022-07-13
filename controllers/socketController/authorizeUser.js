const redisClient = require("../../redis")

module.exports.authorizeUser = async (socket, next) => {
    if (!socket.request.session || !socket.request.session.user) {
        next(new Error("Not authorized"))
    } else {
        socket.user = {
            ...socket.request.session.user
        }
        await redisClient.hset(`userid:${socket.user.username}`, "userid", socket.user.userid)
        next()
    }
}