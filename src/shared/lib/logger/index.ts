import * as winston from 'winston';

const { combine, timestamp, printf, colorize, align, errors, ms } = winston.format;

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    http: 'magenta',
    debug: 'white',
  },
};

winston.addColors(customLevels.colors);

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), 
  ms(),
  errors({ stack: true }), 
  printf((info) => {
    const { timestamp, level, message, context, ms, stack } = info;
    const contextStr = context ? `[${context}]` : '';
    const stackStr = stack ? `\n${stack}` : ''; 
    return `[${timestamp}] ${level} ${contextStr} ${message} ${ms}${stackStr}`;
  }),
);

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf((info) => JSON.stringify(info)), 
);

const logger = winston.createLogger({
  levels: customLevels.levels,
  format: fileFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      level: 'info'
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error', 
    }),
  ],
  exitOnError: false,
});

export default logger;