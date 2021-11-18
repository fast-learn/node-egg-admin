/* eslint valid-jsdoc: "off" */

'use strict'
const path = require('path')

const {
  MYSQL_DB,
  MYSQL_PWD,
  MYSQL_USER,
  MYSQL_PORT,
  MYSQL_HOST
} = require('./db')
const { PRIVATE_KEY } = require('../app/utils/constant')
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {})

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1636943872769_5959'

  // add your middleware config here
  config.middleware = ['jwtAuthorizedHandle']
  // jwt
  config.jwt = {
    secret: PRIVATE_KEY
  }
  // 处理 post 端口的问题
  config.security = {
    csrf: {
      enable: false
    }
  }
  // 跨域处理
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
  }

  // mysql
  config.mysql = {
    client: {
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PWD,
      database: MYSQL_DB
    },
    app: true,
    agent: false
  }
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  }
  config.cluster = {
    https: {
     key: path.join(__dirname,'./https/youbaobao.xyz.key'), // https 证书绝对目录
     cert: path.join(__dirname,'./https/youbaobao.xyz.pem') // https 证书绝对目录
    }
  };

  return {
    ...config,
    ...userConfig
  }
}
