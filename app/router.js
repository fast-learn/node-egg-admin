'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/user/login',controller.user.login);
  router.get('/user/info', app.jwt, controller.user.getUserInfo);
  // 用户管理
  router.get('/role/getUserList', controller.role.getUserList);
  router.get('/role/deleteUser', controller.role.deleteUser);
  router.get('/role/getRoleList', controller.role.getRoleList);
  router.post('/role/addUserAvatar', controller.role.addUserAvatar);
  router.post('/role/addUser', controller.role.addUser);
  router.post('/role/updateUser', controller.role.updateUser);
  // 角色管理
  router.post('/role/addRole', controller.role.addRole);
  router.get('/role/getMenuRole', controller.role.getMenuRole);
  router.post('/role/updataRole', controller.role.updataRole);
  router.get('/role/deleteRole', controller.role.deleteRole);

  // 菜单管理
  router.get('/role/getMenuList', controller.role.getMenuList);
  router.get('/role/addMenu', controller.role.addMenu);
  router.post('/role/updateMenu', controller.role.updateMenu);
  router.get('/role/deleteMenu', controller.role.deleteMenu);
  router.get('/role/getUserMenu', controller.role.getUserMenu);

};
