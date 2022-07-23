const pool = require("../../db")
const { dirname } = require('path');
const fs = require('fs');
const redisClient = require("../../redis");

module.exports.updateAvatar = async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        res.json({
            error: 'Not authorized'
        })
    }

    const userid = req.session.user.id

    let avatarFile = req.files.avatar
    const fileName = `${userid}${avatarFile.name}`
    const path = dirname(require.main.filename) + '/images/avatars/' + fileName

    avatarFile.mv(path, async (error) => {
        if (error) {
            res.writeHead(500, {
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({
                status: 'error',
                message: error
            }))
            return
        }

        res.writeHead(200, {
            'Content-Type': 'application/json'
        })

        const userAvatarQuery = await pool.query(
            "SELECT avatar from users WHERE id=$1",
            [userid]
        )

        const avatarToDelete = userAvatarQuery?.rows[0]?.avatar
        if (avatarToDelete) {
            fs.unlink(dirname(require.main.filename) + '/images/avatars/' + avatarToDelete, (err) => {
                if (err) {
                    console.log(err)
                }
            });
        }

        pool.query(
            "UPDATE users SET avatar=$1 WHERE id=$2",
            [fileName, userid]
        )

        redisClient.hset(`userid:${req.session.user.userid}`, "avatar", fileName)

        res.end(JSON.stringify({
            status: 'success',
            path: fileName
        }))
    })
}