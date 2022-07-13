const redisClient = require("../../redis")
const {
    parseFriendList,
    parseExpectationFriendList,
    isEmptyObj
} = require("./helpers")

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