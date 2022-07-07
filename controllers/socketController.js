const redisClient = require("../redis")

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

module.exports.initializeUser = async socket => {
    socket.user = {
        ...socket.request.session.user
    };
    socket.join(socket.user.userid)
    await redisClient.hset(
        `userid:${socket.user.username}`,
        "userid",
        socket.user.userid,
        "connected",
        true
    );
    const friendList = await redisClient.lrange(
        `friends:${socket.user.username}`,
        0,
        -1
    );

    const parsedFriendList = await parseFriendList(friendList)
    const friendRooms = parsedFriendList.map(friend =>
        friend.userid
    )

    if (friendRooms && friendRooms.length) {
        socket.to(friendRooms).emit("connected", true, socket.user.username)
    }

    socket.emit("friends", parsedFriendList);

    const msgQuery = await redisClient.lrange(`chat:${socket.user.userid}`, 0, -1)

    const messages = msgQuery.map(msgString => {
        const parsedStr = msgString.split(".")
        return {
            to: parsedStr.shift(),
            from: parsedStr.shift(),
            content: parsedStr.join(".")
        }
    })

    if (messages && messages.length) {
        socket.emit("messages", messages)
    }
};

module.exports.addFriend = async (socket, username, cb) => {
    if (username === socket.user.username) {
        cb({
            done: false,
            errorMsg: "You can't add to friends self"
        })
        return
    }

    const friend = await redisClient.hgetall(`userid:${username}`)

    if (!friend) {
        cb({
            done: false,
            errorMsg: "User doesn't exist."
        })
        return
    }

    const currentFriendList = await redisClient.lrange(
        `friends:${socket.user.username}`, 0, -1
    )

    const parsedCurrentFriendList = await parseFriendList(currentFriendList)
    let findedUser = parsedCurrentFriendList.find(friend => friend.username === username)

    if (parsedCurrentFriendList && findedUser) {
        cb({
            done: false,
            errorMsg: "Request already sent"
        })
        return
    }

    await redisClient.lpush(`friends:${socket.user.username}`, [
        username, friend.userid
    ].join('.'))
    cb({
        done: true,
        friend: {
            username,
            userid: friend.userid,
            connected: friend.connected
        }
    })
}

module.exports.onDisconnect = async socket => {
    await redisClient.hset(`userid:${socket.user.username}`, "connected", false)

    const friendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1)
    const parsedFriendList = await parseFriendList(friendList)
    const friendRooms = parsedFriendList.map(friend => friend.userid)

    socket.to(friendRooms).emit("connected", false, socket.user.username)
}

module.exports.dm = async (socket, message) => {
    message.from = socket.user.userid

    const messageString = [message.to, message.from, message.content].join(".")

    await redisClient.lpush(`chat:${message.to}`, messageString)
    await redisClient.lpush(`chat:${message.from}`, messageString)

    socket.to(message.to).emit("dm", message)
}

const parseFriendList = async friendList => {
    const newFriendList = []

    for (let friend of friendList) {
        const parsedFriend = friend.split('.')
        if (parsedFriend.length < 2) {
            continue
        }
        const friendid = parsedFriend.pop()
        const friendname = parsedFriend.join('.')
        const friendConnected = await redisClient.hget(`userid:${friendname}`, "connected")

        newFriendList.push({
            username: friendname,
            userid: friendid,
            connected: eval(friendConnected)
        })
    }
    return newFriendList
}