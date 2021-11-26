async function replaceNumber(app, ctx, data) {
  const getRoleSql = 'select * from role';
  try {
    try {
      const roleList = await app.mysql.query(getRoleSql);
      const dataString = JSON.stringify(roleList);
      const newRoleList = JSON.parse(dataString);
      const newData = data.split(',')
      let newRoleId = [];
      newRoleList.map(item => {
        newData.map(item2 => {
          if (item.name === item2) {
            newRoleId.push(item.id);
          }
        })
      })
      return newRoleId;
    } catch (e) {
      ctx.body = { code: -1, msg: '获取角色失败，失败原因：' + e.message };
      app.logger.error(e.name + ':replaceNumber', e.message);
    }
  } catch (e) {
    ctx.body = { code: -1, msg: '查询角色失败' };
    app.logger.error(e.name + ':replaceNumber', e.message);
  }
}
async function roleNameChangeRoleId(app, ctx, roles) {
  const roleIdList = [];
  for (let i in roles) {
    try {
      const roleId = await app.mysql.query(
        `select id from role where name='${roles[i]}'`
      );
      roleIdList.push(roleId[0].id);
    } catch (e) {
      ctx.body = {
        code: -1,
        msg: '查询用户对应角色失败，失败原因：' + e.message
      };
      app.logger.error(e.name + ':roleNameChangeRoleId', e.message);
    }
  }
  return roleIdList;
}
async function getMenuId(app, ctx, roleIdList) {
  let menuIDList = [];
  for (let i = 0; i < roleIdList.length; i++) {
    const getMenuIdSql = `select menu_id from role_menu where role_id='${roleIdList[i]}'`;
    try {
      const menuID = await app.mysql.query(getMenuIdSql);
      if (menuID && menuID.length > 0) {
        for (let j = 0; j < menuID.length; j++) {
          menuIDList.push(menuID[j]);
        }
      }
    } catch (e) {
      ctx.body = {
        code: -1,
        msg: '获取角色对应菜单失败，失败原因：' + e.message
      };
      app.logger.error(e.name + ':getMenuId', e.message)
    }
  }
  return unique(menuIDList)
}
// 数据去重
function unique(arr) {
  for (var i = 0; i < arr.length; i++) {
    for (var j = i + 1; j < arr.length; j++) {
      if (arr[i].menu_id == arr[j].menu_id) {
        arr.splice(j, 1);
        j--;
      }
    }
  }
  return arr;
}
// 排序
function compare(sort,id){
  return function(a,b){
      var value1 = a[sort];
      var value2 = b[sort];
      return value1 - value2;
  }
}
async function getMenuLists(app, ctx, menuIdList) {
  const newMenuData = [];
 
  for (let i = 0; i < menuIdList.length; i++) {
    const getMenuListSql = `select * from menu where id='${menuIdList[i].menu_id}' order by sort,id asc`;
    try {
      const menuMessageg = await app.mysql.query(getMenuListSql);
      if (menuMessageg && menuMessageg.length > 0 ) {
        newMenuData.push(menuMessageg[0]);
      }
    } catch (e) {
      ctx.body = { code: -1, msg: '查询菜单失败，失败原因：' + e.message };
      app.logger.error(e.name + ':getMenuLists', e.message)
    }
  }
  const newMenuIdList = newMenuData.sort(compare('sort'))
  return newMenuIdList;
}
module.exports = {
  replaceNumber,
  roleNameChangeRoleId,
  getMenuId,
  getMenuLists
}
