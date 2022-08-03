const pool = require("../../db")
const bcrypt = require("bcrypt")

module.exports.attemptLogin = async (req, res) => {
    const potentionLogin = await pool.query(
        "SELECT * FROM users WHERE username=$1",
        [req.body.username]
    )

    const data = potentionLogin.rows[0]

    if (potentionLogin.rowCount > 0) {
        const isSamePass = await bcrypt.compare(
            req.body.password,
            data.passhash
        )

        if (isSamePass) {
            req.session.user = {
                username: req.body.username,
                id: potentionLogin.rows[0].id,
                userid: potentionLogin.rows[0].userid
            }
            res.json({
                loggedIn: true,
                ...data
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