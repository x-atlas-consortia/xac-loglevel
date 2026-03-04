# xac-loglevel


## Development:

```bash
npm i .
npm run dev
```
### Documentation
Methods
The loglevel API is extremely minimal. All methods are available on the root loglevel object, which we suggest you name log (this is the default if you import it globally, and is what's set up in the above examples). The API consists of:

Logging Methods
5 actual logging methods, ordered and available as:
```
log.trace(msg)
log.debug(msg)
log.info(msg)
log.warn(msg)
log.error(msg)
```

```
log.setConfig({level: 'debug', devHost: 'dev.staging.test', color: '#ff0000', logDir: '/path_to_output_logs/})
```