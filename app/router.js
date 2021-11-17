'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const tokenFailureHanndle = app.middleware.tokenFailureHanndle
  router.get('/', tokenFailureHanndle, controller.home.index);
  router.post('/user/login', controller.user.login);
  router.get('/user/info', app.jwt, controller.user.getUserInfo);
};
