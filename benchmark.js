const codec = require('@googlemaps/polyline-codec');

const fs = require('fs');
const bytesWat = fs.readFileSync(__dirname + '/polyline.wasm');
const bytesRust = fs.readFileSync(__dirname + '/rust/polylines/target/wasm32-unknown-unknown/release/polylines.wasm');

let memory = new WebAssembly.Memory({initial: 10000});
let importObj = {
    env: {
        memory
    }
};
let encoder = new TextEncoder();

function decodeRust(obj, str) {
    let line = encoder.encode(str);
    let encoded = new Uint8Array(memory.buffer, 0, line.length);
    encoded.set(line);

    let res = obj.instance.exports.decode(0, line.length, 100000);
    let len = new Uint32Array(memory.buffer, res - 8, 1)[0];

    const b = new Float64Array(memory.buffer, res, len);
    const path = new Array(len >> 1);
    for (let i = 0, j = 0; i < len; j++, i += 2) {
        path[j] = [b[i], b[i + 1]];
    }
    return path;
}

function decodeWasm(obj, str) {
    let line = encoder.encode(str);
    let encoded = new Uint8Array(memory.buffer, 0, line.length);
    encoded.set(line, 0);

    let [res, len] = obj.instance.exports.decode(0, line.length, 100000);

    const b = new Float64Array(memory.buffer, res, len);
    const path = new Array(len >> 1);
    for (let i = 0, j = 0; i < len; j++, i += 2) {
        path[j] = [b[i], b[i + 1]];
    }
    return path;
}

const testUrl = "https://geopuzzle.org/puzzle/world/questions/";

(async () => {
    let wasm = 0, js = 0, rust = 0;
    const n = 10;

    for (let q = 0; q < n; q++) {
        let response = await fetch(testUrl);
        let json = await response.json();

        let objWat = await WebAssembly.instantiate(new Uint8Array(bytesWat), importObj);
        let objRust = await WebAssembly.instantiate(new Uint8Array(bytesRust), importObj);

        let swasm = performance.now();
        let resultWasm = json.questions.map((question) => {
            return {
                id: question.id,
                name: question.name,
                paths: question.polygon.map((str) => (decodeWasm(objWat, str)))
            }
        });
        let ewasm = performance.now();

        let sjs = performance.now();
        let resultJS = json.questions.map((question) => {
            return {
                id: question.id,
                name: question.name,
                paths: question.polygon.map((str) => (codec.decode(str)))
            }
        });
        let ejs = performance.now();

        let srust = performance.now();
        let resultRust = json.questions.map((question) => {
            return {
                id: question.id,
                name: question.name,
                paths: question.polygon.map((str) => (decodeRust(objRust, str)))
            }
        });
        let erust = performance.now();

        wasm += ewasm - swasm;
        js += ejs - sjs;
        rust += erust - srust;
    }
    console.log(wasm / n, rust / n, js / n);
})();
