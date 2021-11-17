'use strict'

const Controller = require('egg').Controller

const { md5 } = require('../../utils/md5')
const { PWD_SALT } = require('../../utils/constant')
const { generateToken, parseToken } = require('../../utils/token')
class UserController extends Controller {
  async login() {
    const { ctx, app } = this
    let { username, password } = ctx.request.body
    password = md5(`${password}${PWD_SALT}`)
    const sql = `select * from user where username = '${username}' and password = '${password}'`
    try {
      const userData = await app.mysql.query(sql)
      if (userData && userData.length > 0) {
        const userId = userData[0].id
        const secret = app.config.jwt.secret
        const token = generateToken({ userId }, secret)
        const data = {
          code: 20000,
          data: { token, userData }
        }
        ctx.body = data
      } else {
        ctx.body = { code: -1, msg: '用户名或密码错误，请检查后重新输入' }
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '登录失败，失败原因：' + e.message }
      app.logger.error(e.name + ':login', e.message)
    }
  }
  async getUserInfo() {
    const { ctx, app } = this
    const token = ctx.get('authorization').split(' ')[1]
    const userId = parseToken(token).userId
    const sql = `select * from user where id = '${userId}'`
    try {
      const userList = await app.mysql.query(sql)
      if (userList && userList.length > 0) {
        const user = userList[0]
        const data = {
          avatar: user.avatar,
          introduction: user.nickname,
          name: user.username,
          roles: user.roles.split(',')
        }
        ctx.body = { code: 20000, data: data }
      } else {
        ctx.body = { code: -1, msg: '获取用户信息失败，失败原因：' }
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '获取用户信息失败，失败原因：' + e.error }
      app.logger.error(e.name + ':getUserInfo', e.message)
    }
  }
}

module.exports = UserController
