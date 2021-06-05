module.exports = (req, res) => {
  req.logout()
  req.flash('success', 'คุณได้ออกจากระบบเสร็จสิ้น')
  return res.redirect('/')
}
