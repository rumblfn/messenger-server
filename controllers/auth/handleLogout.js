module.exports.handleLogout = (req, res) => {
    req.session.user = null
    res.json({
        loggedIn: false
    })
}