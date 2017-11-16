# Swagger2TS
Tool for generate TS definitions from Swagger

## Install

```
    npm i swagger2ts
```

## Example
```
    const s2ts = require('swagger2ts');
    const CONFIG = require('./api.config.example');

    s2ts(CONFIG);
```