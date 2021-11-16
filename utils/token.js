const jwt = require('jsonwebtoken')

const { JWT_EXPIRED, PRIVATE_KEY } = require('./constant')

function getToken(payload = {}, secret, expiresIn = JWT_EXPIRED) {
  return jwt.sign(payload, secret, { expiresIn })
}

function setToken(token, key = PRIVATE_KEY) {
  return jwt.verify(token, key)
}

module.exports = {
  getToken,
  setToken
}
