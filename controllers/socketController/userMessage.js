const redisClient = require("../../redis")

module.exports.dm = async (socket, message, id) => {
    message.from = socket.user.userid

    socket.to(message.to).emit("dm", message, id)

    const messageString = [message.to, message.from, message.content].join(".")

    await redisClient.hincrby(`userid:${message.username}:chats`, message.from, 1)
    await redisClient.lpush(`chat:${message.to}`, messageString)
    await redisClient.lpush(`chat:${message.from}`, messageString)
}