const pool = require("../../db")

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