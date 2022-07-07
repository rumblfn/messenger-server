const redisClient = require("../redis");

module.exports.getFriends = async (req, res) => {
    if (req.session.user && req.session.user.username) {
    
        const friendList = await redisClient.lrange(
            `friends:${req.session.user.username}`,
            0,
            -1
        );

        res.json({
            friendList
        })
    } else {
        res.json({
            error: 'some errors, try later'
        })
    }
}