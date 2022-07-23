const pool = require("../../db")
const { dirname } = require('path');
const fs = require('fs');
const redisClient = require("../../redis");

module.exports.updateBanner = async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        res.json({
            error: 'Not authorized'
        })
    }

    const userid = req.session.user.id

    let bannerFile = req.files.banner
    const fileName = `${userid}${bannerFile.name}`
    const path = dirname(require.main.filename) + '/images/banners/' + fileName

    bannerFile.mv(path, async (error) => {
        if (error) {
            console.error(error)
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

        const userBannerQuery = await pool.query(
            "SELECT banner from users WHERE id=$1",
            [userid]
        )

        const bannerToDelete = userBannerQuery?.rows[0]?.banner
        if (bannerToDelete) {
            fs.unlink(dirname(require.main.filename) + '/images/banners/' + bannerToDelete, (err) => {
                if (err) {
                    console.log(err)
                }
            });
        }

        pool.query(
            "UPDATE users SET banner=$1 WHERE id=$2",
            [fileName, userid]
        )

        redisClient.hset(`userid:${req.session.user.userid}`, "banner", fileName)

        res.end(JSON.stringify({
            status: 'success',
            path: fileName
        }))
    })
}