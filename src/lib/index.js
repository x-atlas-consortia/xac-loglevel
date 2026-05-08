import path from "path";
const fsPackage = "node:fs/promises";
const fileName = "xac-loglevel-config.json";
import _logLevelConfig from "./xac-loglevel-config.json" with { type: "json" };
const storageKey = 'xac-loglevel.'

/**
 * Make sure that directory is created.
 * @param {string} filePath 
 * @param {string} initialContent 
 * @param {bool} debug  whether or not to print logs 
 */
async function ensureDir(filePath, initialContent, debug = false) {
  try {
    const fs = await import(fsPackage);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    if (debug) {
      console.log("xac-loglevel.ensureDir: Directory ready", filePath);
    }
    if (initialContent) {
      await fs
        .writeFile(filePath, initialContent, { flag: "wx" })
        .catch((err) => log._err(err));
    }

  } catch (err) {
    if (debug) {
      console.error("xac-loglevel.ensureDir.catch:", err);
    }
  }
}

let logLevelConfig = _logLevelConfig || { level: "warn" };

const levels = {
  trace: 6,
  debug: 5,
  info: 4,
  warn: 3,
  error: 2,
  dev: 1,
};

const log = {
  /**
   * Returns path of config file
   * @param {bool} debug whether or not to print logs
   * @returns
   */
  getConfigPath: (debug) => {
    const CONFIG_PATH = path.join(
      process.cwd(),
      `node_modules/xac-loglevel/dist/${fileName}`,
    );
    if (log._isNode()) {
      ensureDir(CONFIG_PATH, JSON.stringify(logLevelConfig), debug);
    }
    return global && global.logLevel ? global.logLevel?.path : CONFIG_PATH;
  },

  /**
   * Make sure that directory is created.
   * @param {string} filePath
   * @param {string} initialContent
   * @param {bool} debug  whether or not to print logs
   */
  ensureDir: (filePath, initialContent, debug = false) => {
    ensureDir(filePath, initialContent, debug);
  },

  /**
   * Set up directory for logging.
   * @param {bool} debug  whether or not to print logs
   */
  initLogDirectory: async (debug = false) => {
    Promise.resolve(log.getLogDirectory())
      .then((_dir) => {
        if (_dir && log._isNode()) {
          ensureDir(_dir + "t.log", null, debug);
        }
      })
      .catch((err) => log._err(err));
  },

  /**
   * Checks if running in nodejs / server side environment
   * @returns bool
   */
  _isNode: () => {
    return (
      typeof process !== "undefined" &&
      !!process.versions &&
      !!process.versions.node
    );
  },

  setPath: (_path) => {
    if (!global.logLevel) {
      global.logLevel = {};
    }
    global.logLevel = { ...global.logLevel, path: _path };
  },

  getGlobal: () => {
    return global.logLevel;
  },

  /**
   * Checks if running in the browser
   * @returns bool
   */
  _isInWindow: () => {
    return typeof window !== "undefined" && window.sessionStorage;
  },

  initConfig: async (_path) => {
    const p = _path || log.getConfigPath();
    const fs = await import(fsPackage);
    const data = await fs.readFile(p, "utf8");
    logLevelConfig = JSON.parse(data);
  },

  /**
   * Returns a configuration option
   * @param {*} key
   * @returns string || undefined
   */
  _getConfig: async (key) => {
    if (log._isInWindow()) {
      return (
        window.sessionStorage.getItem(`${storageKey}${key}`) ||
        logLevelConfig[key]
      );
    }

    if (log._isNode()) {
      try {
        await log.initConfig();
        return logLevelConfig[key];
      } catch (e) {
        console.error("xac-loglevel: ", e);
      }
    }
    return null;
  },

  /**
   * Get level, default is warn
   * @returns string
   */
  getLevel: () => {
    return log._getConfig("level");
  },

  /**
   * Get developer hostname
   * @returns string || undefined
   */
  getDevHost: () => {
    return log._getConfig("devHost");
  },

  /**
   * Get hex color string
   * @returns string || undefined
   */
  getColor: () => {
    return log._getConfig("color");
  },

  /**
   * Get absolute path to logging directory
   * @returns string || undefined
   */
  getLogDirectory: () => {
    return log._getConfig("logDir");
  },

  /**
   * Prints import error
   * @param {*} error
   */
  _fsErr: (error) => {
    console.error("xac-loglevel: Failed to import fs module:", error);
  },

  /**
   * Prints import error
   * @param {*} error
   */
  _err: (error) => {
    console.error("xac-loglevel:", error);
  },

  /**
   * Set multiple configuration options
   * @param {object} ops {level, logDir, color, devHost}
   */
  setConfig: (ops) => {
    logLevelConfig = { ...logLevelConfig, ...ops };
    if (log._isNode()) {
      import(fsPackage)
        .then((fs) => {
          console.log(
            "xac-loglevel: Setting configuration at path",
            log.getConfigPath(),
            ops,
          );
          fs.writeFile(
            log.getConfigPath(),
            `${JSON.stringify(logLevelConfig)}`,
            "utf8",
          );
        })
        .catch((error) => {
          log._fsErr(error);
        });
    }
  },

  _sessionConfig: (key, val) => {
    window.sessionStorage.setItem(`${storageKey}${key}`, val);
  },

  /**
   * Sets a single config option
   * @param {string} key
   * @param {string} val
   * @param {string} js
   */
  _addConfig: (key, val, js) => {
    if (log._isInWindow()) {
      log._sessionConfig(key, val);
    }

    log.setConfig(js);
  },

  /**
   * Sets a key: val
   * @param {string} key
   * @param {string} val
   * @returns
   */
  _str: (key, val) => {
    return val ? `${key}: '${val}',` : "";
  },

  /**
   * Set the loglevel
   * @param {string} level
   */
  setLevel: (level) => {
    log._addConfig("level", level, { level });
  },

  /**
   * Set a color for terminal text
   * @param {string} color
   */
  setColor: (color) => {
    log._addConfig("color", color, { color });
  },

  /**
   * Set a development hostname for logging only under a particular hostname
   * @param {string} devHost
   */
  setDevHost: (devHost) => {
    log._addConfig("devHost", devHost, { devHost });
  },

  /**
   * Determines if running under developer hostname or default localhost or .dev
   * @returns bool
   */
  _isLocal: async () => {
    return Promise.resolve(log.getDevHost())
      .then((_devHost) => {
        if (_devHost) {
          return location?.host?.indexOf(_devHost) !== -1;
        }
        return (
          location?.host?.indexOf("localhost") !== -1 ||
          location?.host?.indexOf(".dev") !== -1
        );
      })
      .catch((err) => log._err(err));
  },

  /**
   * Output to the console
   * @param {string} fn
   * @param  {...any} msg
   */
  _console: (fn = "log", ...msg) => {
    Promise.resolve(log.getColor())
      .then((_color) => {
        if (_color) {
          console[fn](`%c ${msg}`, `color: ${_color}`);
        } else {
          console[fn](...msg);
        }
      })
      .catch((err) => log._err(err));

    // Log to file if setup
    Promise.resolve(log.getLogDirectory())
      .then((_dir) => {
        if (_dir && log._isNode()) {
          const date = new Date();
          const logFileName = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-xac-loglevel.log`;
          import(fsPackage)
            .then((fs) => {
              fs.appendFile(
                _dir + logFileName,
                `${date.toLocaleDateString()} > ${fn} > ${msg}`,
                "utf8",
              );
            })
            .catch((error) => {
              log._fsErr(error);
            });
        }
      })
      .catch((err) => log._err(err));
  },

  /**
   * Checks level before outting to console
   * @param {string} level
   * @param {string} fn
   * @param  {...any} msg
   */
  checkLevel: (level, fn, ...msg) => {
    Promise.resolve(log.getLevel())
      .then((_level) => {
        if (levels[_level] >= levels[level]) {
          log._console(fn, ...msg);
        }
      })
      .catch((err) => log._err(err));
  },

  /**
   * Print based on console.trace
   * @param  {...any} msg
   */
  trace: (...msg) => {
    log.checkLevel("trace", "trace", ...msg);
  },

  /**
   * Print based on console.log
   * @param  {...any} msg
   */
  debug: (...msg) => {
    log.checkLevel("debug", "log", ...msg);
  },

  /**
   * Print based on console.error
   * @param  {...any} msg
   */
  error: (...msg) => {
    log.checkLevel("error", "error", ...msg);
  },

  /**
   * Print based on console.warn
   * @param  {...any} msg
   */
  warn: (...msg) => {
    log.checkLevel("warn", "warn", ...msg);
  },

  /**
   * Print based on console.info
   * @param  {...any} msg
   */
  info: (...msg) => {
    log.checkLevel("info", "info", ...msg);
  },

  /**
   * Checks host settings
   * @param {string} fn
   * @param  {...any} msg
   */
  _localCheck: (fn, ...msg) => {
    if (log._isInWindow()) {
      Promise.resolve(log._isLocal())
        .then((_isLocal) => {
          if (_isLocal) {
            log._console(fn, ...msg);
          }
        })
        .catch((err) => log._err(err));
    }
  },

  /**
   * Print based on user location.host
   * @param  {...any} msg
   */
  dev: {
    info: (...msg) => {
      log._localCheck("info", ...msg);
    },
    warn: (...msg) => {
      log._localCheck("warn", ...msg);
    },
    log: (...msg) => {
      log._localCheck("log", ...msg);
    },
    error: (...msg) => {
      log._localCheck("error", ...msg);
    },
    trace: (...msg) => {
      log._localCheck("trace", ...msg);
    },
  },
};

export default log;
