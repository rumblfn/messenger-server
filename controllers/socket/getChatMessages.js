const redisClient = require("../../redis")

module.exports.chatMessages = async (socket, userid) => {
    const msgQuery = await redisClient.lrange(`chats:${socket.user.userid}:${userid}`, 0, -1)

    const messages = msgQuery.map(msgString => {
        const parsedStr = msgString.split(".")
        return {
            timestamp: parsedStr.shift(),
            type: parsedStr.shift(),
            to: parsedStr.shift(),
            from: parsedStr.shift(),
            content: parsedStr.join(".")
        }
    })

    socket.emit("chatMessages", userid, messages)
}
