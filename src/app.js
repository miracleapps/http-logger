const winston = require('winston');
const morgan = require('morgan');

require('winston-daily-rotate-file');
const { format } = require('logform');

// Get file name for the log files
const filename = process.env.APP_NAME || 'app-logs';

const loggerFormat = format.combine(
  format.timestamp(),
  format.align(),
  format.printf(
    (info) =>
      `${info.timestamp.replace('T', ' ').replace('Z', ' ')} ${info.level}: ${
        info.message
      }`
  )
);

const transports = [];

if (process.env.NODE_ENV !== 'production') {
  // Add console logger transport for non-prod environments
  const consoleTransport = new winston.transports.Console({
    level: 'info',
  });

  transports.push(consoleTransport);
} else {
  const fileTransport = new winston.transports.DailyRotateFile({
    level: 'info',
    filename: `./logs/${filename}-%DATE%-http.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  });

  // Add file logger transport to the transports array
  transports.push(fileTransport);
}

// Create http activity logger
const httpLogger = winston.createLogger({
  format: loggerFormat,
  transports,
});

httpLogger.stream = {
  write: (message) => {
    httpLogger.info(message);
  },
};

const httpLoggerMiddleware = morgan(
  ':remote-addr :method :url :status :response-time ms',
  {
    stream: httpLogger.stream,
  }
);

module.exports = httpLoggerMiddleware;
