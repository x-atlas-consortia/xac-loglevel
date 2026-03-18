# xac-loglevel


## Development:

```bash
npm i .
npm run dev
```
### Documentation
#### Logging Methods
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

With `devHost` option, you can then call `log.dev.error(msg)` and this will log whenever the client host matches. Default is `localhost` or `.dev`.