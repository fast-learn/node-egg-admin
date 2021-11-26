'use strict'

const Controller = require('egg').Controller;
const fs = require('fs');
const { md5 } = require('../utils/md5');
const { replaceNumber } = require('../utils/role');
const { andLike } = require('../utils/sql');
const {roleNameChangeRoleId,getMenuId,getMenuLists} = require('../utils/role');
const toArray = require('stream-to-array');
const { UPLOAD_PATH_IMG, UPLOAD_PATH, PWD_SALT } = require('../utils/constant');
class RoleController extends Controller {
  // 用户管理
  async getUserList() {
    const { ctx, app } = this;
    let userSql = `select * from admin_user `;
    const {
      username,
      nickname,
      email,
      sort,
      page = 1,
      pageSize = 20
    } = ctx.query;
    let sortSql;
    const offset = (page - 1) * pageSize > 0 ? (page - 1) * pageSize : 0;
    let where = 'where';
    username && (where = andLike(where, 'username', username));
    nickname && (where = andLike(where, 'nickname', nickname));
    email && (where = andLike(where, 'email', email));
    if (sort) {
      const symbol = sort[0];
      const column = sort.slice(1, sort.length);
      const order = symbol === '+' ? 'asc' : 'desc';
      sortSql = ` order by \`${column}\` ${order}`;
    }
    const pageSql = ` limit ${pageSize} offset ${offset}`;
    let userCountSql = 'select count(*) as count from admin_user  ' + sortSql;
    if (where !== 'where') {
      userSql = `${userSql} ${where}`;
      userCountSql =
        'select count(*) as count from admin_user  ' + where + sortSql;
    }
    const getUserListSql = userSql + sortSql + pageSql;
    try {
      const list = await app.mysql.query(getUserListSql);
      if (list && list.length > 0) {
        const counts = await app.mysql.query(userCountSql);
        const data = { list, count: counts[0].count, page, pageSize };
        ctx.body = { code: 20000, data };
      } else {
        ctx.body = { code: -1, msg: '该用户不存在,请检查查询条件' };
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '获取用户列表失败，失败原因：' + e.message };
      app.logger.error(e.name + ':userRoleList', e.message);
    }
  }
  async deleteUser() {
    const { ctx, app } = this;
    const { username, id } = ctx.query;
    const deleteUserSql = `delete  from admin_user where username = '${username}'`;
    const getRoleSql = `select * from user_role where user_id = '${id}'`;
    if (username === 'admin') {
      ctx.body = { code: -1, msg: '该用户为超级管理员，无法删除' };
    } else {
      try {
        const userRole = await app.mysql.query(getRoleSql);
        if (userRole && userRole.length > 0) {
          ctx.body = { code: -1, msg: '该用户已关联角色，无法删除！' };
        } else {
          try {
            const deleteMessage = await app.mysql.query(deleteUserSql);
            if (deleteMessage) {
              ctx.body = { code: 20000, msg: '用户删除成功' };
            } else {
              ctx.body = { code: -1, msg: '用户删除失败' };
            }
          } catch (e) {
            ctx.body = {
              code: -1,
              msg: '删除用户失败，失败原因：' + e.message
            };
            app.logger.error(e.name + ':deleteUser', e.message);
          }
        }
      } catch (e) {
        ctx.body = { code: -1, msg: '获取用户角色失败' + e.message };
        app.logger.error(e.name + ':deleteUser', e.message);
      }
    }
  }
  async getRoleList() {
    const { ctx, app } = this;
    let sortSql,getRoleSql;
    const { query } = ctx;
    if (query && query.sort) {
      const { sort } = query;
      if (sort) {
        const symbol = sort[0];
        const order = symbol === '+' ? 'asc' : 'desc';
        sortSql = ` order by id ${order}`;
      }
      getRoleSql = 'select * from role ' + sortSql;
    } else {
      getRoleSql = 'select * from role ';
    }
    try {
      const roleList = await app.mysql.query(getRoleSql);
      if (roleList && roleList.length > 0) {
        ctx.body = { code: 20000, data: roleList };
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '获取用户角色列表失败' };
      app.logger.error(e.name + ':getRoleList', e.message);
    }
  }
  async addUserAvatar() {
    const { app, ctx } = this;
    let stream = await ctx.getFileStream();
    const parts = await toArray(stream);
    const buf = Buffer.concat(parts);
    try {
      await fs.writeFileSync(`${UPLOAD_PATH_IMG}/${stream.filename}`, buf);
      const data = {
        fileName: stream.filename,
        filePath: `${UPLOAD_PATH_IMG}/${stream.filename}`,
        url: `${UPLOAD_PATH}/${stream.filename}`
      };
      ctx.body = { code: 20000, msg: '上传头像成功', data };
    } catch (e) {
      ctx.body = { code: -1, msg: '图片保存到文件中失败，失败原因：' + e.message };
      app.logger.error(e.name + ':addUserAvatar', e.message);
    }
  }
  async addUser() {
    const { app, ctx } = this;
    const { query } = ctx;
    const keys = [];
    const values = [];
    const tableName = 'admin_user';
    query.password = md5(`${query.password}${PWD_SALT}`);
    Object.keys(query).forEach(key => {
      if (query.hasOwnProperty(key)) {
        keys.push(`\`${key}\``)
        values.push(`'${query[key]}'`)
      }
    })
    if (keys.length > 0 && values.length > 0) {
      let insertSql = `INSERT INTO \`${tableName}\` (`;
      const keysString = keys.join(',');
      const valuesString = values.join(',');
      insertSql = `${insertSql}${keysString}) VALUES (${valuesString})`;
      const getUser = `select * from admin_user where username='${query.username}'`;
      try {
        const userMessage = await app.mysql.query(getUser);
        if (userMessage && userMessage.length > 0) {
          ctx.body = { code: -1, msg: '用户名已存在，无法添加' };
        } else {
          try {
            const insertUserMessage = await app.mysql.query(insertSql);
            if (insertUserMessage) {
              const getUserIdSql = `select id,role from admin_user where username='${query.username}'`;
              try {
                const getUserIdList = await app.mysql.query(getUserIdSql);
                const dataToString = JSON.stringify(getUserIdList);
                const newRoleList = JSON.parse(dataToString);
                try {
                  const newRoleId = await replaceNumber(
                    app,
                    ctx,
                    newRoleList[0].role
                  );
                  for(let item = 0 ; item < newRoleId.length; item++){
                    const insertUserRoleSql = `INSERT INTO user_role (user_id,role_id) values ('${newRoleList[0].id}','${newRoleId[item]}')`;
                    try {
                      await app.mysql.query(insertUserRoleSql);
                    } catch (e) {
                      ctx.body = { code: -1, msg: '插入用户权限用户失败，失败原因：'+ e.message };
                      app.logger.error(e.name + ':addUser', e.message);
                    }
                  }
                  ctx.body = { code: 20000, msg: '添加用户成功' };
                } catch (e) {
                  ctx.body = {
                    code: -1,
                    msg: '添加用户失败，失败原因：' + e.message
                  };
                  app.logger.error(e.name + ':addUser', e.message);
                }
              } catch (e) {
                ctx.body = {
                  code: -1,
                  msg: '查找用户数据失败，失败原因：' + e.message
                };
                app.logger.error(e.name + ':addUser', e.message);
              }
            }
          } catch (e) {
            ctx.body = { code: -1, msg: '插入用户数据失败，失败原因：'+ e.message };
            app.logger.error(e.name + ':addUser', e.message);
          }
        }
      } catch (e) {
        ctx.body = { code: -1, msg: '获取用户失败，失败原因：'+ e.message };
        app.logger.error(e.name + ':addUser', e.message);
      }
    }
  }
  async updateUser() {
    const entry = [];
    const { ctx, app } = this;
    const { query } = ctx;
    const tableName = 'admin_user';
    const id = query.id;
    const whereSql = `where id='${id}'`;
    delete query.id;
    query.password = md5(`${query.password}${PWD_SALT}`);
    Object.keys(query).forEach(key => {
      if (query.hasOwnProperty(key)) {
        entry.push(`\`${key}\`='${query[key]}'`);
      }
    })
    if (entry.length > 0) {
      let updateSql = `UPDATE \`${tableName}\` SET`;
      updateSql = `${updateSql} ${entry.join(',')} ${whereSql}`;
      const getUser = `select id from admin_user where username='${
        query.username
      }' and id != '${id * 1}'`;
      try {
        const userMessage = await app.mysql.query(getUser);
        if (query.username === 'admin' || id * 1 === 1) {
          ctx.body = { code: -1, msg: '该用户为超级管理员，无法修改' };
        } else {
          if (userMessage && userMessage.length > 0) {
            ctx.body = { code: -1, msg: '用户名已存在，无法添加' };
          } else {
            try {
              const updageUserMessage = await app.mysql.query(updateSql);
              if (updageUserMessage) {
                const newRoleId = await replaceNumber(app, ctx, query.role);
                const deleteUserSql = `delete  from user_role where  user_id='${id}'`;
                try {
                  await app.mysql.query(deleteUserSql);
                  for (let item = 0; item < newRoleId.length; item++) {
                    const insertUserRoleSql = `INSERT INTO user_role (user_id,role_id) values ('${id}','${newRoleId[item]}')`;
                    try {
                      await app.mysql.query(insertUserRoleSql);
                    } catch (e) {
                      ctx.body = {
                        code: -1,
                        msg: '插入角色信息失败，失败原因：' + e.message
                      };
                      app.logger.error(
                        e.name + ':updateUser',
                        e.message
                      );
                    }
                  }
                  ctx.body = { code: 20000, msg: '更新用户成功' }
                } catch (e) {
                  ctx.body = {
                    code: -1,
                    msg: '删除角色关联信息失败' + e.message
                  };
                  app.logger.error(e.name + ':updateUser', e.message);
                }
              }
            } catch (e) {
              ctx.body = {
                code: -1,
                msg: '更新用户数据失败，失败原因：' + e.message
              };
              app.logger.error(e.name + ':updateUser', e.message);
            }
          }
        }
      } catch (e) {
        ctx.body = {
          code: -1,
          msg: '查询用户数据失败，失败原因：' + e.message
        };
        app.logger.error(e.name + ':updateUser', e.message)
      };
    }
  }
  // 角色管理
  async addRole() {
    const { ctx, app } = this;
    const { query } = ctx;
    const { name, menu } = query;
    const insertRoleSql = `INSERT INTO role (name) VALUES ('${name}')`;
    try {
      await app.mysql.query(insertRoleSql);
      const menuList = JSON.parse(JSON.stringify(menu)).split(',')
      const selectRole = `select id from role where name='${name}'`
      try {
        const roleId = await app.mysql.query(selectRole);
        for (let item = 0; item < menuList.length; item++) {
          const menuSql = `INSERT INTO role_menu (menu_id,role_id) values ('${menuList[item]}','${roleId[0].id}')`;
          try {
            await app.mysql.query(menuSql);
          } catch (e) {
            ctx.body = {
              code: -1,
              msg: '添加角色菜单失败，失败原因：' + e.message
            };
            app.logger.error(e.name + ':addRole', e.message);
          }
        }
        ctx.body = { code: 20000, msg: '添加角色成功' };
      } catch (e) {
        ctx.body = { code: -1, msg: '查询用户失败，失败原因：' + e.message };
        app.logger.error(e.name + ':addRole', e.message);
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '插入角色失败，失败原因：' + e.message };
      app.logger.error(e.name + ':addRole', e.message);
    }
  }
  async getMenuList() {
    const { app, ctx } = this;
    const { query } = ctx;
    let sortSql,MenuListSql;
    if (query && query.sort) {
      const { sort } = query;
      if (sort) {
        const symbol = sort[0];
        const order = symbol === '+' ? 'asc' : 'desc';
        sortSql = ` order by sort,id ${order}`;
      }
      MenuListSql = `select * from menu ` + sortSql;
    } else {
      MenuListSql = `select * from menu `;
    }
    try {
      const menuList = await app.mysql.query(MenuListSql);
      if (menuList && menuList.length > 0) {
        ctx.body = { code: 20000, data: menuList };
      } else {
        ctx.body = { code: -1, msg: '菜单获取列表失败' };
      }
    } catch (e) {
      ctx.body = {
        code: -1,
        msg: '菜单获取列表失败，失败原因：' + e.message
      };
      app.logger.error(e.name + ':getMenuList', e.message);
    }
  }
  async getMenuRole() {
    const { ctx, app } = this;
    const { id } = ctx.query;
    const getmenuSql = `select menu_id from role_menu where role_id='${id}'`;
    try {
      const menuList = await app.mysql.query(getmenuSql);
      if (menuList && menuList.length > 0) {
        ctx.body = { code: 20000, data: menuList };
      } else {
        ctx.body = { code: -1, msg: '角色关联的菜单不存在' };
      }
    } catch (e) {
      ctx.body = {
        code: -1,
        msg: '查询角色关联的菜单失败，失败原因：' + e.message
      };
      app.logger.error(e.name + ':getMenuRole', e.message);
    }
  }
  async updataRole() {
    const { ctx, app } = this;
    const { name, id, menu } = ctx.query;
    const updateRoleSql = `update role set name='${name}' where id='${id}'`;
    const deleteMenuSql = `delete from role_menu where role_id='${id}'`;
    try {
      const updateRoleMesasge = await app.mysql.query(updateRoleSql);
      if (updateRoleMesasge) {
        try {
          const deleteMenuMessage = await app.mysql.query(deleteMenuSql);
          if (deleteMenuMessage) {
            const menuList = menu.split(',');
            for (let item = 0; item < menuList.length; item++) {
              const insertMenuSql = `insert into role_menu (role_id,menu_id) values ('${id}', '${menuList[item]}')`;
              try {
                await app.mysql.query(insertMenuSql);
              } catch (e) {
                ctx.body = {
                  code: -1,
                  msg: '插入权限菜单失败，失败原因：' + e.message
                };
                app.logger.error(e.name + ':updataRole', e.message);
              }
            }
            ctx.body = {
              code: 20000,
              msg: '更新角色成功'
            };
          }
        } catch (e) {
          ctx.body = {
            code: -1,
            msg: '删除角色关联菜单失败，失败原因：' + e.message
          };
          app.logger.error(e.name + ':updataRole', e.message);
        }
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '更新角色失败，失败原因：' + e.message }
      app.logger.error(e.name + ':updataRole', e.message);

    }
  }
  async deleteRole() {
    const { app, ctx } = this;
    const { id } = ctx.query;
    const getMenuSql = `select * from role_menu where role_id='${id}'`;
    const getUserSql = `select * from user_role where role_id='${id}'`;
    const deleteRoleSql = `delete from role where id='${id}'`;
    try {
      const getMenuList = await app.mysql.query(getMenuSql);
      if (getMenuList && getMenuList.length > 0) {
        ctx.body = { code: -1, msg: '该角色已关联菜单，不允许删除！' };
      } else {
        try {
          const getUserList = await app.mysql.query(getUserSql);
          if (getUserList && getUserList.length > 0) {
            ctx.body = { code: -1, msg: '该角色已关联用户，不允许删除！' };
          } else {
            try {
              await app.mysql.query(deleteRoleSql);
              ctx.body = { code: 20000, msg: '角色删除成功' };
            } catch (e) {
              ctx.body = { code: -1, msg: '获删除角色失败' + e.message };
              app.logger.error(e.name + ':deleteRole', e.message);
            }
          }
        } catch (e) {
          ctx.body = {
            code: -1,
            msg: '获取角色关联用户失败，失败原因：' + e.message
          };
          app.logger.error(e.name + ':deleteRole', e.message);
        }
      }
    } catch (e) {
      ctx.body = {
        code: -1,
        msg: '获取角色关联菜单失败，失败原因：' + e.message
      };
      app.logger.error(e.name + ':deleteRole', e.message);
    }
  }
  // 菜单管理
  async addMenu() {
    const { ctx, app } = this;
    const { query } = ctx;
    const keys = [];
    const values = [];
    const tableName = 'menu';
    Object.keys(query).forEach(key => {
      if (query.hasOwnProperty(key)) {
        keys.push(`\`${key}\``);
        values.push(`'${query[key]}'`);
      }
    })
    if (keys.length > 0 && values.length > 0) {
      let addMenuSql = `INSERT INTO \`${tableName}\` (`;
      const keysString = keys.join(',');
      const valuesString = values.join(',');
      addMenuSql = `${addMenuSql}${keysString}) VALUES (${valuesString})`;
      const getMenuUrlSql = `select url from menu where url='${query.url}'`;
      try {
        const getMenuUrlMessage = await app.mysql.query(getMenuUrlSql);
        if (getMenuUrlMessage && getMenuUrlMessage.length > 0) {
          ctx.body = { code: -1, msg: 'URL已存在，无法添加' };
        } else {
          try {
            const addMenuMessage = await app.mysql.query(addMenuSql);
            if (addMenuMessage) {
              ctx.body = { code: 20000, msg: '添加菜单成功' };
            }
          } catch (e) {
            ctx.body = {
              code: -1,
              msg: '添加菜单失败，失败原因：' + e.message
            };
            app.logger.error(e.name + ':addMenu', e.message);
          }
        }
      } catch (e) {
        ctx.body = {
          code: -1,
          msg: '获取菜单失败，失败原因：' + e.message
        };
        app.logger.error(e.name + ':addMenu', e.message);
      }
    }
  }
  async updateMenu() {
    const { ctx, app } = this;
    const { query } = ctx;
    const entry = [];
    const id = query.id;
    if (isNaN(query.sort)) {
      ctx.body = { code: -1, msg: 'sort字段只能为数字' };
    }
    const tableName = 'menu';
    const whereSql = `where id='${id}'`;
    delete query.id;
    Object.keys(query).forEach(key => {
      if (query.hasOwnProperty(key)) {
        entry.push(`\`${key}\`='${query[key]}'`);
      }
    })
    if (entry.length > 0) {
      const getMenuUrl = `select id from menu where url='${query.url}'`;
      try {
        const getMenuUrlList = await app.mysql.query(getMenuUrl);
        if (getMenuUrlList.length > 0 && getMenuUrlList[0].id !== id * 1) {
          ctx.body = { code: -1, msg: 'URL已存在，无法添加' };
        } else {
          let addMenuSql = `UPDATE \`${tableName}\` SET`;
          addMenuSql = `${addMenuSql} ${entry.join(',')} ${whereSql}`;
          try {
            const addMenuMessage = await app.mysql.query(addMenuSql);
            if (addMenuMessage) {
              ctx.body = { code: 20000, msg: '更新菜单成功' };
            }
          } catch (e) {
            ctx.body = {
              code: -1,
              msg: '更新菜单失败，失败原因：' + e.message
            };
            app.logger.error(e.name + ':updateMenu', e.message);

          }
        }
      } catch (e) {
        ctx.body = {
          code: -1,
          msg: '获取菜单ID失败，失败原因：' + e.message
        };
        app.logger.error(e.name + ':updateMenu', e.message);
      }
    }
  }
  async deleteMenu() {
    const { ctx, app } = this;
    const { children } = ctx.query;
    const menuId = children.split(',');
    const getMenuRoleSql = `select menu_id from role_menu `;
    try {
      const getmenuRoleSql = await app.mysql.query(getMenuRoleSql);
      if (getmenuRoleSql) {
        const dataToString = JSON.stringify(getmenuRoleSql);
        const menuRoleIdList = JSON.parse(dataToString);
        const arr = [];
        menuRoleIdList.map(item => {
          arr.push(item.menu_id);
        })
        const menuIdList = menuId.filter(a => {
          return !arr.some(c => c == a);
        })
        if (menuIdList.length !== menuId.length) {
          ctx.body = { code: -1, msg: '该菜单已关联角色，不允许删除！' };
        } else {
          for (let item = 0; item < menuIdList.length; item++) {
            const deleteMenuSql = `delete from menu where id='${menuIdList[item]}'`;
            try {
              app.mysql.query(deleteMenuSql);
            } catch (e) {
              ctx.body = {
                code: -1,
                msg: '删除菜单失败，失败原因：' + e.message
              };
              app.logger.error(e.name + ':deleteMenu', e.message);
            }
          }
          ctx.body = { code: 20000, msg: '删除菜单成功' };
        }
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '查询角色菜单失败，失败原因' + e.message };
      app.logger.error(e.name + ':deleteMenu', e.message);
    }
  }
  async getUserMenu() {
    const { ctx, app } = this;
    const roleIdList = await roleNameChangeRoleId(app,ctx,ctx.query);
    const meneIdList = await getMenuId (app,ctx,roleIdList);
    const menuList = await getMenuLists(app,ctx,meneIdList);
    ctx.body = { code: 20000, data: { menu: menuList } };
  }
}

module.exports = RoleController;
