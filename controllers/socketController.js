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

    const unreadOfflineMessagesCounter = await redisClient.hgetall(`userid:${socket.user.username}:chats`)

    if (!isEmptyObj(unreadOfflineMessagesCounter)) {
        socket.emit('unreadMessages', unreadOfflineMessagesCounter)
    }

    const confirmationsQuery = await redisClient.lrange(`friendsExpectation:${socket.user.username}`, 0, -1)
    const confirmations = confirmationsQuery.map(confirmationString => {
        const parsedStr = confirmationString.split('.')
        return {
            type: parsedStr.pop(),
            userid: parsedStr.pop(),
            username: parsedStr.join(".")
        }
    })

    if (confirmations && confirmations.length) {
        socket.emit('confirmations', confirmations)
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

    if (isEmptyObj(friend)) {
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

    if (parsedCurrentFriendList && !isEmptyObj(findedUser)) {
        cb({
            done: false,
            errorMsg: "your friend <3"
        })
        return
    }

    const expectationFriendList = await redisClient.lrange(
        `friendsExpectation:${socket.user.username}`, 0, -1
    )

    const parsedExpectationFriendList = await parseExpectationFriendList(expectationFriendList)

    for (let user of parsedExpectationFriendList) {
        if (user.type === 'outgoing' && user.username === username) {
            await redisClient.lpush(`friends:${socket.user.username}`, [
                username, friend.userid
            ].join('.'))
            await redisClient.lrem(`friendsExpectation:${socket.user.username}`, 1, [
                username, friend.userid, 'outgoing'
            ].join('.'))

            socket.to(friend.userid).emit("add_chat", {
                username: socket.user.username,
                userid: socket.user.userid,
                connected: true
            })

            cb({
                done: true,
                friend: {
                    username,
                    userid: friend.userid,
                    connected: eval(friend.connected)
                }
            })

            await redisClient.lpush(`friends:${username}`, [
                socket.user.username, socket.user.userid
            ].join('.'))

            await redisClient.lrem(`friendsExpectation:${username}`, 1, [
                socket.user.username, socket.user.userid, 'incoming'
            ].join('.'))

            return
        } else if (user.type === 'incoming' && user.username === username) {
            cb({
                done: false,
                errorMsg: "Request already sent"
            })

            return
        }
    }

    await redisClient.lpush(`friendsExpectation:${socket.user.username}`, [
        username, friend.userid, 'incoming'
    ].join('.'))
    await redisClient.lpush(`friendsExpectation:${username}`, [
        socket.user.username, socket.user.userid, 'outgoing'
    ].join('.'))

    socket.to(friend.userid).emit("add_confirmation", {
        username: socket.user.username,
        userid: socket.user.userid,
        type: 'outgoing'
    })

    cb({
        done: true,
        confirmation: {
            userid: friend.userid,
            username,
            type: 'incoming'
        },
        errorMsg: `${username} request is awaiting confirmation`
    })
}

module.exports.onDisconnect = async socket => {
    await redisClient.hset(`userid:${socket.user.username}`, "connected", false)

    const friendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1)
    const parsedFriendList = await parseFriendList(friendList)
    const friendRooms = parsedFriendList.map(friend => friend.userid)

    socket.to(friendRooms).emit("connected", false, socket.user.username)
}

module.exports.dm = async (socket, message, id) => {
    message.from = socket.user.userid

    const messageString = [message.to, message.from, message.content].join(".")

    await redisClient.lpush(`chat:${message.to}`, messageString)
    await redisClient.lpush(`chat:${message.from}`, messageString)

    socket.to(message.to).emit("dm", message, id)

    if (!message.connected) {
        await redisClient.hincrby(`userid:${message.username}:chats`, message.from, 1)
    }
}

module.exports.acceptConf = async (socket, user) => {
    await redisClient.lpush(`friends:${socket.user.username}`, [
        user.username, user.userid
    ].join('.'))
    await redisClient.lrem(`friendsExpectation:${socket.user.username}`, 1, [
        user.username, user.userid, 'outgoing'
    ].join('.'))
    await redisClient.lpush(`friends:${user.username}`, [
        socket.user.username, socket.user.userid
    ].join('.'))
    await redisClient.lrem(`friendsExpectation:${user.username}`, 1, [
        socket.user.username, socket.user.userid, 'incoming'
    ].join('.'))

    socket.to(user.userid).emit("add_chat", {
        username: socket.user.username,
        userid: socket.user.userid,
        connected: true
    })

    socket.emit("add_chat", {
        username: user.username,
        userid: user.userid,
        connected: user.connected // connection
    })
}

module.exports.declineConf = async (socket, user) => {
    await redisClient.lrem(`friendsExpectation:${socket.user.username}`, 1, [
        user.username, user.userid, user.type
    ].join('.'))
    await redisClient.lrem(`friendsExpectation:${user.username}`, 1, [
        socket.user.username, socket.user.userid, user.type === 'incoming' ? 'outgoing' : 'incoming'
    ].join('.'))

    socket.to(user.userid).emit("remove_confirmation", socket.user.username)
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

const parseExpectationFriendList = async expectationFriendList => {
    const newExpectationFriendList = []

    for (let user of expectationFriendList) {
        const parsedFriend = user.split('.')

        if (parsedFriend.length < 3) {
            continue
        }

        const type = parsedFriend.pop()
        const userid = parsedFriend.pop()
        const username = parsedFriend.join('.')
        const userConnected = await redisClient.hget(`userid:${username}`, "connected")

        newExpectationFriendList.push({
            username, userid, type, userConnected: eval(userConnected)
        })
    }

    return newExpectationFriendList
}

function isEmptyObj(object) {
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }