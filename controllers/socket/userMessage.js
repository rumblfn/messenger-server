const redisClient = require("../../redis")

module.exports.dm = async (socket, message, id) => {
    message.from = socket.user.userid

    socket.to(message.to).emit("dm", message, id)

    const messageString = [message.timestamp, message.type, message.to, message.from, message.content].join(".")
    await redisClient.hincrby(`userid:${message.to}:chats`, message.from, 1)

    await redisClient.rpush(`chats:${message.to}:${message.from}`, messageString)
    await redisClient.rpush(`chats:${socket.user.userid}:${message.to}`, messageString)
}