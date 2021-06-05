const passport = require('passport')
const bcrypt = require('bcrypt')
const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook').Strategy

const Users = require('./models/Users')

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, next) => {
  const user = await Users.findOne({ email: email })
  if (!user) {
    return next(null, false, { message: 'ไม่พบชื่อผู้ใช้หรือที่อยู่อีเมล' })
  }
  const result = await bcrypt.compare(password, user.password)
  if (!result) {
    return next(null, false, { message: 'รหัสผ่านไม่ถูกต้อง' })
  }
  return next(null, user) // send passport.serializeUser()
}))

passport.use(new FacebookStrategy({
  clientID: '434037567676436',
  clientSecret: '7afaf1d7613ccde2d6515bb92a2eafc6',
  callbackURL: 'http://localhost:3000/login/facebook/callback',
  profileFields: ['id', 'email']
}, async (accessToken, refreshToken, profile, next) => {
  const email = profile?.emails[0]?.value
  if (!email) {
    return next(null, false, { message: 'กรุณาอนุญาตให้เว็บไซต์เข้าถึงที่อยู่อีเมล' })
  }
  // login ok!
  const user = await Users.findOne({ 'oauth.facebook': profile.id })
  if (user) {
    return next(null, user)
  }
  // create
  const checkExistUser = await Users.findOne({ email: email })
  if (checkExistUser) {
    return next(null, false, { message: 'คุณได้ใช้ที่อยู่อีเมลนี้ในการสมัครสมาชิกสำหรับช่องทางอื่นแล้ว กรุณาเข้าสู่ระบบช่องทางที่คุณเคยเข้า' })
  }
  const userCreated = await Users.create({
    email: email,
    oauth: {
      facebook: profile.id
    }
  })
  return next(null, userCreated)
}))

// save to session (once)
passport.serializeUser((user, next) => {
  return next(null, user._id) // send passport.deserializeUser()
})

// save to req.user (req.session.*)
passport.deserializeUser(async (id, next) => {
  try {
    const user = await Users.findById(id)
    return next(null, user) // req.user = user
  } catch (error) {
    return next(error)
  }
})

/////////////////////

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/my-oauth', {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const express = require('express')
const flash = require('connect-flash')
const session = require('express-session')
const app = express()

app.set('view enging', 'pug')
app.set('views', './views')
app.use(express.urlencoded({ extended: false }))
app.use(session({ secret: '123', resave: false, saveUninitialized: false }))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.use((req, res, next) => {
  res.locals.success = req.flash('success')[0]
  res.locals.error = req.flash('error')[0]
  res.locals.user = req.user
  next()
})

const router = require('express-async-router').AsyncRouter()
router.get('/', require('./controllers/renderIndex'))
router.get('/register', require('./controllers/renderRegister'))
router.post('/register', require('./controllers/handleRegister'))
router.get('/login', require('./controllers/renderLogin'))
app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login', // res.redirect()
  failureFlash: true, // req.flash('error', error)
  successRedirect: '/',
  successFlash: 'เข้าสู่ระบบเสร็จสิ้น' // req.flash('success', 'message')
}))
router.get('/logout', require('./controllers/handleLogout'))
app.get('/login/facebook', passport.authenticate('facebook', {
  scope: ['email']
}))
app.get('/login/facebook/callback', passport.authenticate('facebook', {
  failureRedirect: '/login',
  failureFlash: true,
  successRedirect: '/',
  successFlash: 'เข้าสู่ระบบเสร็จสิ้น'
}))
app.use(router)

app.listen(3000, () => console.log('App listening on http://localhost:3000'))
