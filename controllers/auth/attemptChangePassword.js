const pool = require("../../db")
const bcrypt = require("bcrypt")

module.exports.attemptChangePassword = async (req, res) => {
    const password = req.body.oldPassword
    const newPassword = req.body.newPassword

    if (req.session.user && req.session.user.username) {

        const username = req.session.user.username

        const potentionLogin = await pool.query(
            "SELECT passhash FROM users WHERE username=$1",
            [username]
        )

        if (potentionLogin.rowCount > 0) {
            const isSamePass = await bcrypt.compare(
                password,
                potentionLogin.rows[0].passhash
            )

            if (isSamePass) {

                const hashedPass = await bcrypt.hash(newPassword, 10)

                await pool.query(
                    "UPDATE users SET passhash=$1 WHERE username=$2",
                    [hashedPass, username]
                )

                res.json({
                    loggedIn: true,
                    status: 'Password successfully changed'
                })
            } else {
                res.json({
                    loggedIn: false,
                    status: "Wrong password"
                })
            }

        } else {
            res.json({
                loggedIn: false,
                status: "Wrong username or password"
            })
        }

    } else {
        res.json({
            loggedIn: false,
            status: 'not authorized'
        })
    }
}