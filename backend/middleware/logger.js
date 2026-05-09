const config = require('../config');

const logger = (req, res, next) => {
  if (config.nodeEnv === 'test') return next();

  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const log = `${method} ${originalUrl} ${statusCode} ${duration}ms`;

    if (statusCode >= 500) {
      console.error(log);
    } else if (statusCode >= 400) {
      console.warn(log);
    } else {
      console.log(log);
    }
  });

  next();
};

module.exports = { logger };
