const redisClient = require("../../redis")

module.exports.readMessages = async (socket, userid) => {
    await redisClient.hdel(`userid:${socket.user.userid}:chats`, userid)
}