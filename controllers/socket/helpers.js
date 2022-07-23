const redisClient = require("../../redis")

module.exports.parseFriendList = async friendList => {
    const newFriendList = []

    for (let friend of friendList) {
        const parsedFriend = friend.split('.')
        if (parsedFriend.length < 2) {
            continue
        }
        const friendid = parsedFriend.pop()
        const friendname = parsedFriend.join('.')
        const friendFromBase = await redisClient.hgetall(`userid:${friendid}`)

        newFriendList.push({
            username: friendname,
            userid: friendid,
            connected: eval(friendFromBase?.connected),
            lastActiveTime: friendFromBase?.lastActiveTime,
            description: friendFromBase?.about,
            avatar: friendFromBase?.avatar,
            banner: friendFromBase?.banner
        })
    }
    return newFriendList
}

module.exports.parseExpectationFriendList = async expectationFriendList => {
    const newExpectationFriendList = []

    for (let user of expectationFriendList) {
        const parsedFriend = user.split('.')

        if (parsedFriend.length < 3) {
            continue
        }

        const type = parsedFriend.pop()
        const userid = parsedFriend.pop()
        const username = parsedFriend.join('.')
        const userConnected = await redisClient.hget(`userid:${userid}`, "connected")

        newExpectationFriendList.push({
            username, userid, type, userConnected: eval(userConnected)
        })
    }

    return newExpectationFriendList
}

module.exports.isEmptyObj = (object) => {
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }