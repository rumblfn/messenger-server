const Yup = require("yup")

const formScheme = Yup.object({
    username: Yup.string()
        .required("Username required!")
        .min(5, "short username!")
        .max(30, "Username too long"),
    password: Yup.string()
        .required("Password required!")
        .min(8, "short password!"),
})

const validateForm = (req, res, next) => {
    const formData = req.body;
    formScheme.validate(formData)
        .catch(err => {
            res.status(422).send()
        })
        .then(valid => {
            if (valid) {
                next()
            } else {
                res.status(422).send()
            }
        })
}

module.exports = {
    validateForm,
    formScheme
}