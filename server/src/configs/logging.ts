import pino, { LoggerOptions } from 'pino';
import { config } from 'dotenv';

config();

const logConfig: LoggerOptions = {
  name: 'tmu-connect-api',
  level: process.env.PINO_LOG_LEVEL || 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['email'],
  },
};

if (process.env.ENVIRONMENT !== 'prod') {
  logConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
}

const LOGGER = pino(logConfig);

export default LOGGER;
