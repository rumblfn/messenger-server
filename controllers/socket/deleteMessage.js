const redisClient = require("../../redis")

module.exports.delMessage = async (socket, message, flag) => {
    console.log(message)

    // socket.to(message.to).emit("dm", message, id)

    // const messageString = [message.timestamp, message.type, message.to, message.from, message.content].join(".")

    // await redisClient.hincrby(`userid:${message.to}:chats`, message.from, 1)

    if (!message?.index && message?.index !== 0) {
        return
    }

    try {
        if (message.to !== socket.user.userid) {
            await redisClient.lset(`chats:${socket.user.userid}:${message.to}`, message.index, '')
    
            if (flag) {
                socket.to(message.to).emit("delete-message", message.index, socket.user.userid)
                await redisClient.lset(`chats:${message.to}:${socket.user.userid}`, message.index, '')
            }
        } else {
            await redisClient.lset(`chats:${message.to}:${message.from}`, message.index, '')
    
            if (flag) {
                socket.to(message.from).emit("delete-message", message.index, message.to)
                await redisClient.lset(`chats:${message.from}:${message.to}`, message.index, '')
            }
        }
    } catch (e) {
        console.log(e)
    }
}