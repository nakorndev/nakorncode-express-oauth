const bcrypt = require('bcrypt')

const Users = require('../models/Users')

module.exports = async (req, res) => {
  req.body.password = await bcrypt.hash(req.body.password, 10)
  await Users.create(req.body)
  req.flash('success', 'คุณได้สมัครบัญชีเสร็จสิ้น')
  return res.redirect('/')
}
