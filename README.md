# Swagger2TS
Tool for generate TS definitions from Swagger

## Install

```
    npm i swagger2ts
```

## Example

api.config.example.js
```
    module.exports = CONFIG = {
        api_url: 'http://localhost:18000/api/schema/1.0/?format=openapi',
        swagger_file: './api_schema.json',
        interfaces_dist_folder: './src/interfaces/'
    }
```


index.js
```
    const s2ts = require('swagger2ts');
    const CONFIG = require('./api.config.example');

    s2ts(CONFIG);
```