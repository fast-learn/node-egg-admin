'use strict'

const Controller = require('egg').Controller

const { md5 } = require('../../utils/md5')
const { PWD_SALT } = require('../../utils/constant')
const { getToken,setToken }  = require('../../utils/token')
class UserController extends Controller {
  async index() {
    const { ctx, app } = this
    let { username, password } = ctx.request.body
    password = md5(`${password}${PWD_SALT}`)
    const sql = `select * from user where username = '${username}' and password = '${password}'`
    const userData = await app.mysql.query(sql)
    if (userData && userData.length > 0) {
      const userId = userData[0].id
      const secret = app.config.jwt.secret
      const token = getToken({ userId }, secret);
      const data = {
        code: 20000,
        data: { token, userData }
      }
      ctx.body = data
    } else {
      ctx.body = { code: -1, msg: '用户名或密码错误，请检查后重新输入' }
    }
  }
  async getUserInfo() {
    const { ctx, app } = this
    const { token } = ctx.query
    const userId = setToken(token).userId
    const sql = `select * from user where id = '${userId}'`
    const userMessage = await app.mysql.query(sql)
    const data = {
      avatar: userMessage[0].avatar,
      introduction: userMessage[0].nickname,
      name: userMessage[0].username,
      roles: userMessage[0].roles.split(',')
    }
    ctx.body = { code: 20000, data: data }
  }
}

module.exports = UserController
