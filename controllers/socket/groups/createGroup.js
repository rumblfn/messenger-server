const redisClient = require("../../../redis");
const {
  v4: uuidv4
} = require('uuid')

module.exports.createGroup = async (socket, params, cb) => {
  const groupId = uuidv4()
  const groupName = params.name || 'Unknown group name'
  const groupObj = {
    name: groupName,
    id: groupId,
    owner: socket.user.userid,
    unreadMessages: "0",
  }

  await redisClient.hset(`groups:${groupId}`,
    "name", groupName,
    "owner", socket.user.userid
  )
  const groupString = [groupId, 0].join(".")

  for (const friendId of (params?.addedFriends || [])) {
    const friend = await redisClient.hgetall(`userid:${friendId}`)
    if (friend) {
      await redisClient.lpush(`userid:${friendId}:groups`, groupString)
      await redisClient.rpush(`groups:${groupId}:members`, friendId)
      socket.to(friend.userid).emit("add_group", groupObj)
    }
  }

  cb({
    done: true,
    group: groupObj
  })
}