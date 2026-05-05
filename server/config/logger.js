import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format for console output.
 */
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const msg = stack || message;
  return `${timestamp} [${level}]: ${msg}`;
});

/**
 * Custom log format for file output (JSON for machine parsing).
 */
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance.
 * - Console: colored, human-readable (all levels in dev, warn+ in prod)
 * - File: JSON format for error.log and combined.log
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
  defaultMeta: { service: 'court-kacheri' },
  transports: [
    // Console transport — always active
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    }),

    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5 MB rotation
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

/**
 * Stream for morgan HTTP logging integration.
 */
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
