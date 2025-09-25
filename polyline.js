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

(async () => {
    let obj = await WebAssembly.instantiate(new Uint8Array(bytes), importObj);

    const n = 100;

    console.log("n(points) wasm js");
[10, 50, 70, 100, 150, 200, 300, 500, 700, 1000, 2000, 3000, 5000, 10000, 50000, 100000, 500000].forEach((size) => {
    let wsum = 0, jsum = 0;

for (let k = 0; k < n; k++) {

    let coords = [];
    for (let i = 0; i < size; i++) {
        let lat = (Math.floor(Math.random() * 18000) - 9000) / 100;
        let lng = (Math.floor(Math.random() * 36000) - 18000) / 100;
        coords.push([lat, lng])
    }
    let str = codec.encode(coords, 5);

    let swasm = performance.now();
    const path = decodeWasm(obj, str);
    let ewasm = performance.now();

    let sjs = performance.now();
    const pathJS = codec.decode(str);
    let ejs = performance.now();

    wsum += ewasm - swasm;
    jsum += ejs - sjs;
}
    console.log(size, wsum / n, jsum / n);
})
})();
