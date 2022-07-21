const pool = require("../db")
const bcrypt = require("bcrypt")
const {
    v4: uuidv4
} = require('uuid')

module.exports.handleLogin = (req, res) => {
    if (req.session.user && req.session.user.username) {
        res.json({
            loggedIn: true,
            username: req.session.user.username
        })
    } else {
        res.json({
            loggedIn: false
        })
    }
}

module.exports.handleLogout = (req, res) => {
    req.session.user = null
    res.json({
        loggedIn: false
    })
}

module.exports.attemptLogin = async (req, res) => {
    const potentionLogin = await pool.query(
        "SELECT id, username, passhash, userid FROM users WHERE username=$1",
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
                username: req.body.username
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

module.exports.attemptRegister = async (req, res) => {

    const existingUser = await pool.query(
        "SELECT username from users WHERE username=$1",
        [req.body.username]
    )

    if (existingUser.rowCount === 0) {
        const hashedPass = await bcrypt.hash(req.body.password, 10)

        const newUserQuery = await pool.query(
            "INSERT INTO users(username, passhash, userid) values($1, $2, $3) RETURNING id, username, userid",
            [req.body.username, hashedPass, uuidv4()]
        )

        req.session.user = {
            username: req.body.username,
            id: newUserQuery.rows[0].id,
            userid: newUserQuery.rows[0].userid
        }
        res.json({
            loggedIn: true,
            username: req.body.username
        })

    } else {
        res.json({
            loggedIn: false,
            status: "Username taken"
        })
    }
}

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