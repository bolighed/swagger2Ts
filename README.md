# Swagger2TS
Tool for generate TS definitions from Swagger

## Install

```
    npm i swagger2ts
```

## Example

index.js
```
    const s2ts = require('../index.js');
    const path = require('path');
    const CONFIG = {
        api_url: 'http://localhost:18000/api/schema/1.0/?format=openapi',
        swagger_file: path.resolve(__dirname, './api_schema.json'),
        interfaces_dist_folder: path.resolve(__dirname, './src/interfaces/')
    }

    s2ts(CONFIG);
```

if `api_url` is missing it will use the `swagger_file` path to retrieve the file  