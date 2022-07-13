const redisClient = require("../../redis")

module.exports.dm = async (socket, message, id) => {
    message.from = socket.user.userid

    socket.to(message.to).emit("dm", message, id)

    const messageString = [message.timestamp, message.to, message.from, message.content].join(".")

    await redisClient.hincrby(`userid:${message.username}:chats`, message.from, 1)
    await redisClient.rpush(`chat:${message.to}`, messageString)
    await redisClient.rpush(`chat:${message.from}`, messageString)
}