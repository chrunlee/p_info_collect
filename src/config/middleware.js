const path = require('path');
const isDev = think.env === 'development';

module.exports = [
  {
    handle: 'meta',
    options: {
      logRequest: isDev,
      sendResponseTime: isDev
    }
  },
  {
    handle: 'resource',
    enable: isDev,
    options: {
      root: path.join(think.ROOT_PATH, 'www'),
      publicPath: /^\/(static|favicon\.ico|MP_verify_oRZfzi2YmJMW7Vl5\.txt)/
    }
  },
  {
    handle: 'trace',
    enable: !think.isCli,
    options: {
      debug: isDev,
      error(err, ctx) {
        ctx.redirect('/index/index');
        return false;
    }
    }
  },
  {
    handle: 'payload',
    options: {
      keepExtensions: true,
      limit: '25mb',
      uploadDir: path.join(think.ROOT_PATH, 'www', 'static', 'upload', 'tmp')
    }
  },
  {
    handle: 'router',
    options: {}
  },
  'logic',
  'controller'
];
