const pool = require("../../db")

module.exports.handleLogin = async (req, res) => {
    if (req.session.user && req.session.user.username) {

        const potentionLogin = await pool.query(
            "SELECT id, username, userid, email, avatar, banner, description FROM users WHERE username=$1",
            [req.session.user.username]
        )

        res.json({
            loggedIn: true,
            username: req.session.user.username,
            id: potentionLogin.rows[0].id,
            userid: potentionLogin.rows[0].userid,
            email: potentionLogin.rows[0].email,
            avatar: potentionLogin.rows[0].avatar,
            banner: potentionLogin.rows[0].banner,
            description: potentionLogin.rows[0].description
        })
    } else {
        res.json({
            loggedIn: false
        })
    }
}