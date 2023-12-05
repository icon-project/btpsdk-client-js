import {
  assert
} from '../error/index';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  OFF = 'OFF',
  ALL = 'ALL'
};

const LogLevels: { [ name: string ]: number } = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  OFF: 5
};

let _level: number = LogLevels[process.env.BTP_LOG_LEVEL ?? LogLevel.DEBUG]

export class Logger {
  #mod: string;

  constructor(mod: string) {
    this.#mod = mod;
  }

  #log (lv: LogLevel, args: Array<any>): void {
    if (LogLevels[lv] < _level) {
      return;
    }
    console.log.apply(console, [`${lv.at(0)}|${new Date().toISOString()}|${this.#mod}|`].concat(args));
  }

  debug (...args: Array<any>): void {
    this.#log(LogLevel.DEBUG, args);
  }

  info (...args: Array<any>): void {
    this.#log(LogLevel.INFO, args);
  }

  warn (...args: Array<any>): void {
    this.#log(LogLevel.WARN, args);
  }

  error (...args: Array<any>): void {
    this.#log(LogLevel.ERROR, args);
  }

  static setLevel (lv: LogLevel): void {
    assert(LogLevels[lv] != null, `invalid log level(${lv})`);
    _level = LogLevels[lv];
  }

  static of (mod: string): Logger {
    return new Logger(mod);
  }
}

export function getLogger(mod: string): Logger {
  return Logger.of(mod);
}
