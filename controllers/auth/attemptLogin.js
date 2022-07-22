const pool = require("../../db")
const bcrypt = require("bcrypt")

module.exports.attemptLogin = async (req, res) => {
    const potentionLogin = await pool.query(
        "SELECT id, username, passhash, userid, email, avatar, banner, description FROM users WHERE username=$1",
        [req.body.username]
    )

    if (potentionLogin.rowCount > 0) {
        const isSamePass = await bcrypt.compare(
            req.body.password,
            potentionLogin.rows[0].passhash
        )

        if (isSamePass) {
            req.session.user = {
                username: req.body.username,
                id: potentionLogin.rows[0].id,
                userid: potentionLogin.rows[0].userid
            }
            res.json({
                loggedIn: true,
                username: req.body.username,
                id: potentionLogin.rows[0].id,
                userid: potentionLogin.rows[0].userid,
                email: potentionLogin.rows[0].email,
                avatar: potentionLogin.rows[0].avatar,
                banner: potentionLogin.rows[0].banner,
                description: potentionLogin.rows[0].description
            })
        } else {
            res.json({
                loggedIn: false,
                status: "Wrong username or password"
            })
        }

    } else {
        res.json({
            loggedIn: false,
            status: "Wrong username or password"
        })
    }
}