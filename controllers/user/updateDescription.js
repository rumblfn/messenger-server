const pool = require("../../db")
const redisClient = require("../../redis")

module.exports.updateDescription = async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        res.json({
            error: 'Not authorized'
        })
    }

    const userid = req.session.user.id

    let about = req.body.about
    
    pool.query(
        "UPDATE users SET description=$1 WHERE id=$2",
        [about, userid]
    )

    redisClient.hset(`userid:${req.session.user.userid}`, "about", about)

    res.end(JSON.stringify({
        status: 'success',
        about
    }))

}