const jwt = require('jsonwebtoken');

const { JWT_EXPIRED, PRIVATE_KEY } = require('./constant');

function generateToken(payload = {}, secret, expiresIn = JWT_EXPIRED) {
  return jwt.sign(payload, secret, { expiresIn });
}

function parseToken(token, key = PRIVATE_KEY) {
  return jwt.verify(token, key);
}

module.exports = {
  generateToken,
  parseToken
}
