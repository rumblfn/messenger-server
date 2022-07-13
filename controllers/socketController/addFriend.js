const pool = require("../../db")
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

    const userid = (await pool.query("SELECT userid FROM users WHERE username=$1 LIMIT 1", [username])).rows[0]?.userid
    const friend = await redisClient.hgetall(`userid:${userid}`)

    if (isEmptyObj(friend)) {
        cb({
            done: false,
            errorMsg: "User doesn't exist."
        })
        return
    }

    const currentFriendList = await redisClient.lrange(
        `friends:${socket.user.userid}`, 0, -1
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
        `friendsExpectation:${socket.user.userid}`, 0, -1
    )

    const parsedExpectationFriendList = await parseExpectationFriendList(expectationFriendList)

    for (let user of parsedExpectationFriendList) {
        if (user.type === 'outgoing' && user.username === username) {
            await redisClient.lpush(`friends:${socket.user.userid}`, [
                username, friend.userid
            ].join('.'))
            await redisClient.lrem(`friendsExpectation:${socket.user.userid}`, 1, [
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

            await redisClient.lpush(`friends:${userid}`, [
                socket.user.username, socket.user.userid
            ].join('.'))

            await redisClient.lrem(`friendsExpectation:${userid}`, 1, [
                socket.user.username, socket.user.userid, 'incoming'
            ].join('.'))

            return
        } else if (user.type === 'incoming' && user.userid === userid) {
            cb({
                done: false,
                errorMsg: "Request already sent"
            })

            return
        }
    }

    await redisClient.lpush(`friendsExpectation:${socket.user.userid}`, [
        username, friend.userid, 'incoming'
    ].join('.'))
    await redisClient.lpush(`friendsExpectation:${userid}`, [
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