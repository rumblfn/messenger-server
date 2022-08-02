const pool = require("../../db")

module.exports.getFriends = async (req, res) => {
    if (req.session.user && req.session.user.username) {

    } else {
        res.json({
            status: false
        })
    }
}