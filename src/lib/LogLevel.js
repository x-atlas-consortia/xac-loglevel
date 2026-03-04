import path from 'path'
import { logLevelConfig } from './config'

const defaultLevel = 'warn'

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
    if (this._isNode()) {
      import('node:fs/promises').then((fs) => {
        fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
      })
        .catch((error) => {
          console.error("Failed to import fs module:", error);
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
      return window.sessionStorage.getItem(key) || global.apiConfig[key]
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

 
  setConfig(ops) {
    
    if (this._isNode()) {
      import('node:fs/promises').then((fs) => {
        fs.writeFile(CONFIG_PATH, `export const logLevelConfig = ${JSON.stringify(ops)};`, 'utf8')
      })
        .catch((error) => {
          console.error("Failed to import fs module:", error);
        });

    }
  }

  _addConfig(key, val, js) {
    global.apiConfig[key] = val
    if (this._isInWindow()) {
      window.sessionStorage.setItem(key, val)
    }

    if (this._isNode()) {
      import('node:fs/promises').then((fs) => {
        fs.writeFile(CONFIG_PATH, `export const logLevelConfig = ${js};`, 'utf8')
      })
        .catch((error) => {
          console.error("Failed to import fs module:", error);
        });

    }
  }

  _str(key, val) {
    return val ? `${key}: '${val}',` : '' 
  }

  setLevel(level) {
    this._addConfig('level', level, `{level: '${level}', ${this._str('devHost', logLevelConfig?.devHost)} ${this._str('color', logLevelConfig?.color)}}`)
  }

  setColor(color) {
    this._addConfig('color', color, `{level: '${logLevelConfig?.level}', ${this._str('devHost', logLevelConfig?.devHost)} color: '${color}'}`)
  }


  setDevHost(devHost) {
    this._addConfig('devHost', devHost, `{level: '${logLevelConfig?.level}', devHost: '${devHost}', ${this._str('color', logLevelConfig?.color)}}`)
  }

  _isLocal() {
    if (logLevelConfig.devHost) {
      return (location.host.indexOf(logLevelConfig.devHost) !== -1)
    }
    return (location.host.indexOf('localhost') !== -1) || (location.host.indexOf('.dev') !== -1)
  }

  _console(msg, fn = 'log') {
    if (this.getColor()) {
      console[fn](`%c ${msg}`, `color: ${this.getColor()}`)
    } else {
      console[fn](msg)
    }
  }

  _out(msg, level, fn = 'log') {
    if (levels[this.getLevel()] >= levels[level]) {
      this._console(msg, fn)

    }
  }

  trace(msg) {
    this._out(msg, 'trace', 'trace')
  }

  debug(msg) {
    this._out(msg, 'debug')
  }

  error(msg) {
    this._out(msg, 'error', 'error')
  }

  warn(msg) {
    this._out(msg, 'warn', 'warn')
  }

  info(msg) {
    this._out(msg, 'info')
  }

  dev(msg, fn = 'log') {
    if (this._isLocal()) {
      this._console(msg, fn)
    }
  }
}

const log = new LogLevel()

global.apiConfig = { level: defaultLevel };

export default log 
