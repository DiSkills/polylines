const codec = require('@googlemaps/polyline-codec');

const fs = require('fs');
const bytes = fs.readFileSync(__dirname + '/polyline.wasm');

let memory = new WebAssembly.Memory({initial: 10000});
let importObj = {
    env: {
        buffer: memory
    }
};
let encoder = new TextEncoder();

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
    let wasm = 0, js = 0;
    const n = 100;

    for (let q = 0; q < n; q++) {
        let response = await fetch(testUrl);
        let json = await response.json();

        let obj = await WebAssembly.instantiate(new Uint8Array(bytes), importObj);

        let swasm = performance.now();
        let resultWasm = json.questions.map((question) => {
            return {
                id: question.id,
                name: question.name,
                paths: question.polygon.map((str) => (decodeWasm(obj, str)))
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

        wasm += ewasm - swasm;
        js += ejs - sjs;
    }
    console.log(wasm / n, js / n);
})();
