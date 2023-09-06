const pool = require("../../db")

module.exports.handleLogin = async (req, res) => {
    console.log(req)
    if (req.session.user && req.session.user.username) {

        const potentionLogin = await pool.query(
            "SELECT * FROM users WHERE username=$1",
            [req.session.user.username]
        )

        const data = potentionLogin.rows[0]

        if (!potentionLogin.rowCount) {
            res.json({
                loggedIn: false
            })
            return
        }

        res.json({
            loggedIn: true,
            ...data
        })
    } else {
        res.json({
            loggedIn: false
        })
    }
}