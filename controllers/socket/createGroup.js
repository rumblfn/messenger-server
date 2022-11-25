const redisClient = require("../../redis");
const {
  v4: uuidv4
} = require('uuid')

module.exports.createGroup = async (socket, params, cb) => {
  console.log(params)

  const groupId = uuidv4()
  const groupName = params.name || 'Unknown group name'
  const groupObj = {
    name: groupName,
    id: groupId
  }

  await redisClient.hset(`groups:${groupId}`,
    "name", groupName,
    "owner", socket.user.userid
  )
  await redisClient.rpush(`groups:${groupId}:members`, socket.user.userid)
  await redisClient.hset(`userid:${socket.user.userid}:groups:${groupId}`,
    "id", groupId,
    "unreadMessages", 0
  )

  for (const friendId of params?.addedFriends || []) {
    const friend = await redisClient.hgetall(`userid:${friendId}`)
    if (friend) {
      await redisClient.rpush(`groups:${groupId}:members`, friendId)
      socket.to(friend.userid).emit("add_group", groupObj)
    }
  }

  cb({
    done: true,
    group: groupObj
  })
}