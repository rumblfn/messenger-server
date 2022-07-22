const pool = require("../db")
const bcrypt = require("bcrypt")
const {
    v4: uuidv4
} = require('uuid')
const nodeMailer = require('nodemailer')
require("dotenv").config();

module.exports.handleLogin = async (req, res) => {
    if (req.session.user && req.session.user.username) {

        const potentionLogin = await pool.query(
            "SELECT id, username, userid, email, avatar, banner FROM users WHERE username=$1",
            [req.session.user.username]
        )

        res.json({
            loggedIn: true,
            username: req.session.user.username,
            id: potentionLogin.rows[0].id,
            userid: potentionLogin.rows[0].userid,
            email: potentionLogin.rows[0].email,
            avatar: potentionLogin.rows[0].avatar,
            banner: potentionLogin.rows[0].banner
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
        "SELECT id, username, passhash, userid, email, avatar, banner FROM users WHERE username=$1",
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
                banner: potentionLogin.rows[0].banner
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
            username: req.body.username,
            id: newUserQuery.rows[0].id,
            userid: newUserQuery.rows[0].userid
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

module.exports.changeEmail = async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        res.json({
            sent: false
        })
        return
    }

    let transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'messengerserviceemailer@gmail.com',
            pass: process.env.EMAIL_MAC_CODE
        }
    });

    const userid = req.session.user.id
    const randomValue = parseInt(Math.random() * 1000000)

    await pool.query(
        "DELETE FROM emailsverification WHERE userid=$1",
        [userid]
    )

    let mailOptions = {
        from: 'Messenger',
        to: req.body.email,
        subject: 'Confirm password in Messenger',
        text: 'Code verification',
        html: `
            <h4 style="color: red">
                ${randomValue}
            </h4> 
            <b>paste this code to the field and confirm</b><br>
            <p>This code is valid for 5 minutes</p>
        `
    };

    transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
            res.json({
                sent: false
            })
            return console.log(error);
        }
        res.json({
            sent: true
        })

        const currentTime = (new Date()).getTime()
    
        await pool.query(
            `INSERT INTO emailsverification(userid, email, timestamp, code) values($1, $2, $3, $4)`,
            [userid, req.body.email, currentTime, randomValue]
        )
    });
}

module.exports.verifyCode = async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        res.json({
            sent: false
        })
        return
    }

    const userid = req.session.user.id
    const code = req.body.code

    const verify = await pool.query(
        "SELECT email, timestamp, code FROM emailsverification WHERE userid=$1",
        [userid]
    )

    if (verify.rowCount > 0) {
        const isSameCode = verify.rows[0].code === code
        
        if (isSameCode) {
            const delay = 5 * 60 * 1000
            const currentTime = new Date().getTime()
            const time = new Date(+verify.rows[0].timestamp + delay).getTime()
            
            if (time > currentTime) {

                await pool.query(
                    "DELETE FROM emailsverification WHERE userid=$1",
                    [userid]
                )

                await pool.query(
                    "UPDATE users SET email=$1 WHERE id=$2",
                    [verify.rows[0].email, userid]
                )

                res.json({
                    status: true,
                    error: 'Email changed'
                })
            } else {
                await pool.query(
                    "DELETE FROM emailsverification WHERE userid=$1",
                    [userid]
                )

                res.json({
                    status: false,
                    error: 'verification code has expired, try email again'
                })
            }

        } else {
            res.json({
                status: false,
                error: 'Invalid verification code, try email again'
            })
        }

    } else {
        res.json({
            status: false,
            error: 'No verification code'
        })
        return
    }
}