const redisClient = require("../../redis")

module.exports.chatMessages = async (socket, userid) => {
    const msgQuery = await redisClient.lrange(`chats:${socket.user.userid}:${userid}`, 0, -1)
    const user = await redisClient.hgetall(`userid:${userid}`)

    const messages = msgQuery.map((msgString, index) => {
        if (!msgString) {
            return null
        }
        const parsedStr = msgString.split(".")
        return {
            index,
            timestamp: parsedStr.shift(),
            type: parsedStr.shift(),
            to: parsedStr.shift(),
            from: parsedStr.shift(),
            content: parsedStr.join("."),
            username: user?.username
        }
    })

    socket.emit("chatMessages", userid, messages, msgQuery.length)
}
