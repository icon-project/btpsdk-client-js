import winston from 'winston';

import type {
  Logger,
  LoggerOptions
} from 'winston';

import {
  merge
} from './index';

const { combine, timestamp, printf } = winston.format;

const format = (label: string) => {
  return combine(
    winston.format.label({ label }),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ timestamp, level, label, message }) => `${level.toUpperCase()[0]}|${timestamp}|${label}| ${message}`)
  );
}

const LOG_LEVEL = process.env.BTP_LOG_LEVEL || 'error';

const OPTIONS = {
  level: LOG_LEVEL,
  transports: [ new winston.transports.Console() ],
  format: format('unknown'),
}

export function getLogger(mod: string, options?: LoggerOptions): Logger {
  const base = { ...OPTIONS, format: format(mod) };
  return winston.createLogger(options != null ? merge(base, { ...options }) : base);
}
