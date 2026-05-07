import path from "path";
import logLevelConfig from "./xac-loglevel-config.json" with { type: "json" };
const fsPackage = "node:fs/promises";

import { fileURLToPath } from "node:url";
const fileName = "xac-loglevel-config.json";
let CONFIG_PATH;
if (fileURLToPath) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  CONFIG_PATH = path.join(__dirname, fileName);
} else {
  let _path = path.join(__dirname, fileName);
  const virtualRoot = "/ROOT";
  _path = _path.startsWith(virtualRoot)
    ? _path.replace(virtualRoot, "")
    : _path;
  CONFIG_PATH = path.join(process.cwd(), _path);
}

const levels = {
  trace: 6,
  debug: 5,
  info: 4,
  warn: 3,
  error: 2,
  dev: 1,
};

const log = {
  init: () => {
    if (log.getLogDirectory() && log._isNode()) {
      import(fsPackage)
        .then((fs) => {
          fs.mkdir(path.dirname(log.getLogDirectory() + "t.log"), {
            recursive: true,
          });
        })
        .catch((error) => {
          log._fsErr(error);
        });
    }
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

  /**
   * Checks if running in the browser
   * @returns bool
   */
  _isInWindow: () => {
    return typeof window !== "undefined" && window.sessionStorage;
  },

  /**
   * Returns a configuration option
   * @param {*} key
   * @returns string || undefined
   */
  _getConfig: (key) => {
    if (log._isInWindow()) {
      return window.sessionStorage.getItem(key) || logLevelConfig[key];
    }

    if (log._isNode()) {
      return logLevelConfig[key];
    }
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
   * Set multiple configuration options
   * @param {object} ops {level, logDir, color, devHost}
   */
  setConfig: (ops) => {
    if (log._isNode()) {
      import(fsPackage)
        .then((fs) => {
          console.log(
            "xac-loglevel: Setting configuration at path",
            CONFIG_PATH,
            ops,
          );
          fs.writeFile(
            CONFIG_PATH,
            `${JSON.stringify({ ...logLevelConfig, ...ops })}`,
            "utf8",
          );
        })
        .catch((error) => {
          log._fsErr(error);
        });
    }
  },

  /**
   * Sets a single config option
   * @param {string} key
   * @param {string} val
   * @param {string} js
   */
  _addConfig: (key, val, js) => {
    if (log._isInWindow()) {
      window.sessionStorage.setItem(key, val);
    }

    if (log._isNode()) {
      import(fsPackage)
        .then((fs) => {
          fs.writeFile(CONFIG_PATH, `${JSON.stringify(js)}`, "utf8");
        })
        .catch((error) => {
          log._fsErr(error);
        });
    }
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
    log._addConfig("level", level, { ...logLevelConfig, level });
  },

  /**
   * Set a color for terminal text
   * @param {string} color
   */
  setColor: (color) => {
    log._addConfig("color", color, { ...logLevelConfig, color });
  },

  /**
   * Set a development hostname for logging only under a particular hostname
   * @param {string} devHost
   */
  setDevHost: (devHost) => {
    log._addConfig("devHost", devHost, { ...logLevelConfig, devHost });
  },

  /**
   * Determines if running under developer hostname or default localhost or .dev
   * @returns bool
   */
  _isLocal: () => {
    if (log._isInWindow()) {
      if (logLevelConfig.devHost) {
        return location?.host?.indexOf(logLevelConfig.devHost) !== -1;
      }
      return (
        location?.host?.indexOf("localhost") !== -1 ||
        location?.host?.indexOf(".dev") !== -1
      );
    }
    return null;
  },

  /**
   * Output to the console
   * @param {string} fn
   * @param  {...any} msg
   */
  _console: (fn = "log", ...msg) => {
    if (log.getColor()) {
      console[fn](`%c ${msg}`, `color: ${log.getColor()}`);
    } else {
      console[fn](...msg);
    }

    if (log.getLogDirectory() && log._isNode()) {
      const date = new Date();
      const logFileName = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-xac-loglevel.log`;
      import(fsPackage)
        .then((fs) => {
          fs.appendFile(
            log.getLogDirectory() + logFileName,
            `${date.toLocaleDateString()} > ${fn} > ${msg}`,
            "utf8",
          );
        })
        .catch((error) => {
          log._fsErr(error);
        });
    }
  },

  /**
   * Checks level before outting to console
   * @param {string} level
   * @param {string} fn
   * @param  {...any} msg
   */
  checkLevel: (level, fn, ...msg) => {
    if (levels[log.getLevel()] >= levels[level]) {
      log._console(fn, ...msg);
    }
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
   * Print based on user location.host
   * @param  {...any} msg
   */
  dev: {
    info: (...msg) => {
      if (log._isLocal()) {
        log._console("info", ...msg);
      }
    },
    warn: (...msg) => {
      if (log._isLocal()) {
        log._console("warn", ...msg);
      }
    },
    log: (...msg) => {
      if (log._isLocal()) {
        log._console("log", ...msg);
      }
    },
    error: (...msg) => {
      if (log._isLocal()) {
        log._console("error", ...msg);
      }
    },
    trace: (...msg) => {
      if (log._isLocal()) {
        log._console("trace", ...msg);
      }
    },
  },
};

export default log;
