module.exports = (options, app) => {
  return async function(ctx, next) {
    try {
      await next()
    } catch (err) {
      ctx.app.emit('error', err, ctx)
      const status = err.status || 500
      if (status === 401) {
        ctx.body = {
          code: 50008,
          msg: 'token 已经过期，请重新登录'
        }
      }
    }
  }
}
