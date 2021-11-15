'use strict'

const Controller = require('egg').Controller

const { md5 } = require('../../utils/md5')
const { PWD_SALT } = require('../../utils/constant')

class UserController extends Controller {
  async index() {
    const { ctx, app } = this
    let { username, password } = ctx.request.body
    password = md5(`${password}${PWD_SALT}`)
    const sql = `select * from user where username='${username}' and password = '${password}'`
    const user = await app.mysql.query(sql)
    if (user && user.length > 0) {
      const data = {
        code: 20000,
        data: user
      }
      ctx.body = data
    } else {
      ctx.body = { code: -1, msg: '用户名或密码错误，请检查后重新输入' }
    }
  }
  async getInfo() {
    const { ctx } = this
    // 模拟vue-element-admin接口数据 确保能够进入到首页
    const data = {
      avatar:
        'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      introduction: 'I am a super administrator',
      name: 'Super Admin',
      roles: ['admin']
    }
    ctx.body = { code: 20000, data: data }
  }
}

module.exports = UserController
