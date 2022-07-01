const express = require("express");
const validateForm = require("../controllers/validateForm");
const router = express.Router();
const pool = require("../db")
const bcrypt = require("bcrypt")

pool.connect()

router
  .route("/login")
  .get(async (req, res) => {
    if (req.session.user && req.session.user.username) {
        console.log("loggedin")
        res.json({
            loggedIn: true, username: req.session.user.username 
        })
    } else {
        res.json({
            loggedIn: false
        })
    }
  })
  .post(async (req, res) => {
    validateForm(req, res)
    console.log(req.session.user)

    const potentionLogin = await pool.query(
        "SELECT id, username, passhash FROM users WHERE username=$1", 
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
                id: potentionLogin.rows[0].id
            }
            res.json({
                loggedIn: true,
                username: req.body.username
            })
            console.log('y')
        } else {
            res.json({
                loggedIn: false, status: "Wrong username or password"
            })
            console.log('n')
        }

    } else {
        res.json({
            loggedIn: false, status: "Wrong username or password"
        })
        console.log('n')
    }
})

router.post('/signup', async (req, res) => {
    validateForm(req, res)

    const existingUser = await pool.query(
        "SELECT username from users WHERE username=$1",
        [req.body.username]
    )

    if (existingUser.rowCount === 0) {
        const hashedPass = await bcrypt.hash(req.body.password, 10)

        const newUserQuery = await pool.query(
            "INSERT INTO users(username, passhash) values($1, $2) RETURNING id, username",
            [req.body.username, hashedPass]
        )

        req.session.user = {
            username: req.body.username, 
            id: newUserQuery.rows[0].id
        }
        res.json({
            loggedIn: true,
            username: req.body.username
        })

        console.log('y')

    } else {
        res.json({
            loggedIn: false,
            status: "Username taken"
        })
        console.log('n')
    }
})

module.exports = router