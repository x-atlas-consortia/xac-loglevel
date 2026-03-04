import path from 'path'
import { logLevelConfig } from './config.js'
const fsPackage = 'node:fs/promises'

const CONFIG_PATH = path.join(process.cwd(), 'node_modules/xac-loglevel/dist/config.js')

const levels = {
  trace: 6,
  debug: 5,
  info: 4,
  warn: 3,
  error: 2,
  dev: 1
}

export class LogLevel {
  
  constructor() {
    if (this.getLogDirectory() && this._isNode()) {
      import(fsPackage).then((fs) => {
        fs.mkdir(path.dirname(this.getLogDirectory() + 't.log'), { recursive: true })
      })
        .catch((error) => {
         this._fsErr(error);
        });
    }
  }

  _isNode() {
    return typeof process !== 'undefined' && !!process.versions && !!process.versions.node;
  }

  _isInWindow() {
    return typeof window !== 'undefined' && window.sessionStorage
  }

  _getConfig(key) {
    if (this._isInWindow()) {
      return window.sessionStorage.getItem(key) || logLevelConfig[key]
    }

    if (this._isNode()) {
      return logLevelConfig[key]
    }
  }

  getLevel() {
    return this._getConfig('level')
  }

  getDevHost() {
    return this._getConfig('devHost')
  }

  getColor() {
    return this._getConfig('color')
  }

  getLogDirectory() {
    return this._getConfig('logDir')
  }

  _fsErr(error) {
    console.error("xac-loglevel: Failed to import fs module:", error);
  }
 
  setConfig(ops) {
    if (this._isNode()) {
      import(fsPackage).then((fs) => {
        fs.writeFile(CONFIG_PATH, `export const logLevelConfig = ${JSON.stringify({...logLevelConfig, ...ops})};`, 'utf8')
      })
        .catch((error) => {
          this._fsErr(error);
        });
    }
  }

  _addConfig(key, val, js) {
    if (this._isInWindow()) {
      window.sessionStorage.setItem(key, val)
    }

    if (this._isNode()) {
      import(fsPackage).then((fs) => {
        fs.writeFile(CONFIG_PATH, `export const logLevelConfig = ${js};`, 'utf8')
      })
        .catch((error) => {
          this._fsErr(error);
        });
    }
  }

  _str(key, val) {
    return val ? `${key}: '${val}',` : '' 
  }

  setLevel(level) {
    this._addConfig('level', level, `{level: '${level}', ${this._str('logDir', logLevelConfig?.logDir)} ${this._str('devHost', logLevelConfig?.devHost)} ${this._str('color', logLevelConfig?.color)}}`)
  }

  setColor(color) {
    this._addConfig('color', color, `{level: '${logLevelConfig?.level}', ${this._str('logDir', logLevelConfig?.logDir)} ${this._str('devHost', logLevelConfig?.devHost)} color: '${color}'}`)
  }

  setDevHost(devHost) {
    this._addConfig('devHost', devHost, `{level: '${logLevelConfig?.level}', ${this._str('logDir', logLevelConfig?.logDir)} devHost: '${devHost}', ${this._str('color', logLevelConfig?.color)}}`)
  }

  _isLocal() {
    if (logLevelConfig.devHost) {
      return (location.host.indexOf(logLevelConfig.devHost) !== -1)
    }
    return (location.host.indexOf('localhost') !== -1) || (location.host.indexOf('.dev') !== -1)
  }

  _console(fn = 'log', ...msg) {
    if (this.getColor()) {
      console[fn](`%c ${msg}`, `color: ${this.getColor()}`)
    } else {
      console[fn](...msg)
    }

    if (this.getLogDirectory() && this._isNode()) {
      const date = new Date()
      const logFileName = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-xac-loglevel.log`
      import(fsPackage).then((fs) => {
        fs.appendFile(this.getLogDirectory() + logFileName, `${date.toLocaleDateString()} > ${fn} > ${msg}`, 'utf8')
      })
        .catch((error) => {
          this._fsErr(error);
        });
    }
  }

  _out(level, fn, ...msg) {
    if (levels[this.getLevel()] >= levels[level]) {
      this._console(fn, ...msg)
    }
  }

  trace(...msg) {
    this._out('trace', 'trace', ...msg)
  }

  debug(...msg) {
    this._out('debug', 'log', ...msg)
  }

  error(...msg) {
    this._out('error', 'error', ...msg)
  }

  warn(...msg) {
    this._out('warn', 'warn', ...msg)
  }

  info(...msg) {
    this._out('info', 'info', ...msg)
  }

  dev(fn = 'log', ...msg) {
    if (this._isLocal()) {
      this._console(fn, ...msg)
    }
  }
}

const log = new LogLevel()

export default log 
