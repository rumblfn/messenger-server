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
    socket.user = { ...socket.request.session.user };
    await redisClient.hset(
      `userid:${socket.user.username}`,
      "userid",
      socket.user.userid
    );
    const friendList = await redisClient.lrange(
      `friends:${socket.user.username}`,
      0,
      -1
    );
    console.log(`${socket.user.username} friends:`, friendList);
    socket.emit("friends", friendList);
};

module.exports.addFriend = async (socket, username, cb) => {
    if (username === socket.user.username) {
        cb({done: false, errorMsg: "You can't add to friends self"})
        return
    }

    const friendUserId = await redisClient.hget(`userid:${username}`, "userid")

    if (!friendUserId) {
        cb({done: false, errorMsg: "User doesn't exist."})
        return
    }

    const currentFriendList = await redisClient.lrange(
        `friends:${socket.user.username}`, 0, -1
    )

    console.log(currentFriendList)

    if (currentFriendList && currentFriendList.indexOf(username) !== -1) {
        cb({done: false, errorMsg: "Request already sent"})
        return
    }

    await redisClient.lpush(`friends:${socket.user.username}`, username)
    cb({done: true })
}