const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const CONFIG = require('./api.config');
const fetch = require('node-fetch');

let sub_interfaces = [];

fetch(CONFIG.api_url).then((res) => {
    return res.text();
}).then((body) => {
    fs.writeFile(CONFIG.swagger_file, body, (err) => {
        if (err) throw err;
        fs.readFile(path.join(__dirname, CONFIG.swagger_file), 'utf8', (err, data) => {
            if (err) throw (err);
            const parsed_file = JSON.parse(data);
            for (var key in parsed_file.paths) {
                const t = generateInterfaceByPath(parsed_file.paths[key], key);
                const file_path = path.join(`${CONFIG.interfaces_dist_folder}${snakeTheName(key)}.ts`);
                fs.writeFile(file_path, t, (err) => {
                    if (err) throw (err);
                    console.log(file_path + " generated!");
                });
            }
        });
    });
});

function snakeTheName(key) {
    return `${key.replace('/', '').replace(/\//g, "_").replace(/{/g, "").replace(/}/g, "").replace(/-/g, "_").slice(0, -1)}`;
}

function camelTheName(key) {
    return "I" + className(key);
}

function className(key) {
    return capitalizeFirstLetter(_.camelCase(key.replace('api_external', '').replace('api', '')));
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function swaggerType2TSType(type, optional_type) {
    switch (type) {
        case 'integer':
            return 'number';
            break;
        case 'array':
            return `Array<${optional_type || 'any'}>`;
            break;
        default:
            return type;
            break;
    }
}

function generateInterfaceByPath(path_object, key) {
    let full_interface = ''
    for (var method_key in path_object) {
        if (path_object.hasOwnProperty(method_key)) {
            var method = path_object[method_key];
            if (method) {
                if (method_key === 'get') {
                    full_interface += generateParametersInterfaceFromGetMethod(key, method_key, method);
                    full_interface += generateResponseInterfaceFromGetMethod(key, method_key, method);
                } else if (method_key === 'post' || method_key === 'put') {
                    full_interface += generateParametersInterfaceFromPostMethod(key, method_key, method);
                } else if (method_key === 'delete') {
                    full_interface += generateParametersInterfaceFromDeleteMethod(key, method_key, method);
                }
            }
        }
    }
    return full_interface;
}

function generateParameters(parameters) {
    let interface_text = '';
    parameters.forEach(function (parameter) {
        interface_text += `  ${parameter.name}: ${swaggerType2TSType(parameter.type)};\n`
    });
    return interface_text;
}

function generateStartInterface(key, method_key, extra_text = '') {
    return `export interface ${camelTheName(key)}${capitalizeFirstLetter(method_key)}${extra_text} {\n`;
}

function generateParametersInterfaceFromGetMethod(key, method_key, method) {
    let interface_text = generateStartInterface(key, method_key, 'Parameters');
    interface_text += generateParameters(method.parameters);
    interface_text += '}\n';
    return interface_text;
}

function generateParametersInterfaceFromPostMethod(key, method_key, method) {
    let interface_text = generateStartInterface(key, method_key, 'Parameters');
    method.parameters.forEach((parameter) => {
        if (parameter.schema) {
            interface_text += generateSchema(parameter.schema, `${camelTheName(key)}${capitalizeFirstLetter(method_key)}Response`);
        }
    });
    interface_text += '}\n';
    return interface_text;
}

function generateParametersInterfaceFromDeleteMethod(key, method_key, method) {
    let interface_text = generateStartInterface(key, method_key, 'Parameters');
    interface_text += generateParameters(method.parameters);
    interface_text += '}\n';
    return interface_text;
}

function generateResponseInterfaceFromGetMethod(key, method_key, method) {
    let interface_text = generateStartInterface(key, method_key, 'Response');
    if (method.responses["200"].schema && method.responses["200"].schema.type === 'object') {
        interface_text += generateSchema(method.responses["200"].schema, `${camelTheName(key)}${capitalizeFirstLetter(method_key)}Response`)
    }
    interface_text += '}\n';
    sub_interfaces.forEach((sub_interface) => {
        interface_text += sub_interface;
    });
    sub_interfaces = []; // clear sub interface
    return interface_text;
}

function generateSchema(schema, main_interface_name = '') {
    let interface_text = '';
    for (let key in schema.properties) {
        if (schema.properties.hasOwnProperty(key)) {
            const prop = schema.properties[key];
            interface_text += prop.hasOwnProperty('description') && prop.description !== '' ? `  /** ${prop.description} */\n` : '';
            if (prop.name) {
                interface_text += `  ${prop.name}`
            } else {
                interface_text += `  ${key}`
            }
            if (prop.type === 'array' && prop.items) {
                const t = generateObjectInterface(main_interface_name + capitalizeFirstLetter(prop.name), prop.items);
                sub_interfaces.push(t);
            }
            interface_text += prop.hasOwnProperty('required') ? (prop.required === true ? '' : '?') : '';
            interface_text += `: ${swaggerType2TSType(prop.type, main_interface_name + capitalizeFirstLetter(prop.name || ''))}\n`;
        }
    }
    return interface_text;
}

function generateObjectInterface(interface_name, object) {
    let interface_text = `export interface ${interface_name} {\n`;
    interface_text += generateSchema(object);
    interface_text += '}\n';
    return interface_text;
}