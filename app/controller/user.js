'use strict'

const Controller = require('egg').Controller;
const utils = require('utility');

const { generateToken, parseToken } = require('../utils/token');
class UserController extends Controller {
  async login() {
    const { ctx, app } = this;
    let { username, password } = ctx.request.body;
    password = utils.sha1(`${password}`);
    const sql = `select * from admin_user where username = '${username}' and password = '${password}'`;
    try {
      const userData = await app.mysql.query(sql);
      if (userData && userData.length > 0) {
        const userId = userData[0].id;
        const secret = app.config.jwt.secret;
        const status = userData[0].status;
        if(status == 0){
          ctx.body = { code: -1, msg: '该用户已删除' };
        }else{
          const token = generateToken({ userId }, secret);
          const data = {
            code: 20000,
            data: { token }
          };
          ctx.body = data;
        }
      } else {
        ctx.body = { code: -1, msg: '用户名或密码错误，请检查后重新输入' };
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '登录失败，失败原因：' + e.message };
      app.logger.error(e.name + ':login', e.message);
    }
  }
  async getUserInfo() {
    const { ctx, app } = this;
    const token = ctx.get('authorization').split(' ')[1];
    const userId = parseToken(token).userId;
    const sql = `select * from admin_user where id = '${userId}'`;
    try {
      const userList = await app.mysql.query(sql);
      if (userList) {
        const user = userList[0];
        const getUserRoleSql = `select role_id from user_role where user_id='${user.id}'`;
        try {
          const roleList = await app.mysql.query(getUserRoleSql);
          if (roleList && roleList.length > 0) {
            const roleNameList = [];
            for (let i = 0; i < roleList.length; i++) {
              const getRoleNameSql = `select name as roleName from role where id='${roleList[i].role_id}'`;
              try {
                const roleName = await app.mysql.query(getRoleNameSql);
                roleNameList.push(roleName[0].roleName);
                const data = {
                  avatar: user.avatar,
                  introduction: user.nickname,
                  name: user.username,
                  roles: roleNameList
                };
                ctx.body = { code: 20000, data };
              } catch (e) {
                ctx.body = {
                  code: -1,
                  msg: '查询角色失败，失败原因：' + e.message
                };
                app.logger.error(e.name + ':getUserInfo', e.message);
              }
            }
          }
        } catch (e) {
          ctx.body = {
            code: -1,
            msg: '查询用户对应的角色ID失败，失败原因：' + e.message
          };
          app.logger.error(e.name + ':getUserInfo', e.message);
        }
      } else {
        ctx.body = { code: -1, msg: '用户不存在' };
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '获取用户信息失败，失败原因：' + e.message };
      app.logger.error(e.name + ':getUserInfo', e.message);
    }
  }
}

module.exports = UserController;
