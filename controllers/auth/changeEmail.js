const pool = require("../../db");
const nodeMailer = require('nodemailer')

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

    await transporter.sendMail(mailOptions, async (error, info) => {
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
          `INSERT INTO emailsverification(userid, email, timestamp, code)
           values ($1, $2, $3, $4)`,
          [userid, req.body.email, currentTime, randomValue]
        )
    });
}