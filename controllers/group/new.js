module.exports.newGroup = async (req, res) => {
  const body = req?.body
  const user = req?.session?.user

  console.log(body)
  console.log(user)
}