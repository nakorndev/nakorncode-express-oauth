const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: String,
  oauth: {
    facebook: String,
    google: String
  }
})

module.exports = mongoose.model('Users', schema)
