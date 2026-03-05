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

  /**
   * Checks if running in nodejs / server side environment
   * @returns bool
   */
  _isNode() {
    return typeof process !== 'undefined' && !!process.versions && !!process.versions.node;
  }

  /**
   * Checks if running in the browser
   * @returns bool
   */
  _isInWindow() {
    return typeof window !== 'undefined' && window.sessionStorage
  }

  /**
   * Returns a configuration option
   * @param {*} key 
   * @returns string || undefined
   */
  _getConfig(key) {
    if (this._isInWindow()) {
      return window.sessionStorage.getItem(key) || logLevelConfig[key]
    }

    if (this._isNode()) {
      return logLevelConfig[key]
    }
  }

  /**
   * Get level, default is warn
   * @returns string
   */
  getLevel() {
    return this._getConfig('level')
  }

  /**
   * Get developer hostname
   * @returns string || undefined
   */
  getDevHost() {
    return this._getConfig('devHost')
  }

  /**
   * Get hex color string
   * @returns string || undefined
   */
  getColor() {
    return this._getConfig('color')
  }

  /**
   * Get absolute path to logging directory
   * @returns string || undefined
   */
  getLogDirectory() {
    return this._getConfig('logDir')
  }

  /**
   * Prints import error
   * @param {*} error 
   */
  _fsErr(error) {
    console.error("xac-loglevel: Failed to import fs module:", error);
  }
 
  /**
   * Set multiple configuration options
   * @param {object} ops {level, logDir, color, devHost}
   */
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

  /**
   * Sets a single config option
   * @param {string} key 
   * @param {string} val 
   * @param {string} js 
   */
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

  /**
   * Sets a key: val
   * @param {string} key 
   * @param {string} val 
   * @returns 
   */
  _str(key, val) {
    return val ? `${key}: '${val}',` : '' 
  }

  /**
   * Set the loglevel
   * @param {string} level 
   */
  setLevel(level) {
    this._addConfig('level', level, `{level: '${level}', ${this._str('logDir', logLevelConfig?.logDir)} ${this._str('devHost', logLevelConfig?.devHost)} ${this._str('color', logLevelConfig?.color)}}`)
  }

  /**
   * Set a color for terminal text
   * @param {string} color 
   */
  setColor(color) {
    this._addConfig('color', color, `{level: '${logLevelConfig?.level}', ${this._str('logDir', logLevelConfig?.logDir)} ${this._str('devHost', logLevelConfig?.devHost)} color: '${color}'}`)
  }

  /**
   * Set a development hostname for logging only under a particular hostname
   * @param {string} devHost 
   */
  setDevHost(devHost) {
    this._addConfig('devHost', devHost, `{level: '${logLevelConfig?.level}', ${this._str('logDir', logLevelConfig?.logDir)} devHost: '${devHost}', ${this._str('color', logLevelConfig?.color)}}`)
  }

  /**
   * Determines if running under developer hostname or default localhost or .dev
   * @returns bool
   */
  _isLocal() {
    if (logLevelConfig.devHost) {
      return (location.host.indexOf(logLevelConfig.devHost) !== -1)
    }
    return (location.host.indexOf('localhost') !== -1) || (location.host.indexOf('.dev') !== -1)
  }

  /**
   * Output to the console
   * @param {string} fn 
   * @param  {...any} msg 
   */
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

  /**
   * Checks level before outting to console
   * @param {string} level 
   * @param {string} fn 
   * @param  {...any} msg 
   */
  _checkLevel(level, fn, ...msg) {
    if (levels[this.getLevel()] >= levels[level]) {
      this._console(fn, ...msg)
    }
  }

  /**
   * Print based on console.trace
   * @param  {...any} msg 
   */
  trace(...msg) {
    this._checkLevel('trace', 'trace', ...msg)
  }

  /**
   * Print based on console.log
   * @param  {...any} msg 
   */
  debug(...msg) {
    this._checkLevel('debug', 'log', ...msg)
  }

  /**
   * Print based on console.error
   * @param  {...any} msg 
   */
  error(...msg) {
    this._checkLevel('error', 'error', ...msg)
  }

  /**
   * Print based on console.warn
   * @param  {...any} msg 
   */
  warn(...msg) {
    this._checkLevel('warn', 'warn', ...msg)
  }

  /**
   * Print based on console.info
   * @param  {...any} msg
   */
  info(...msg) {
    this._checkLevel('info', 'info', ...msg)
  }

  /**
   * Print based on user location.host
   * @param {*} fn 
   * @param  {...any} msg 
   */
  dev(fn = 'log', ...msg) {
    if (this._isLocal()) {
      this._console(fn, ...msg)
    }
  }
}

const log = new LogLevel()

export default log 
