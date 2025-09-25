const maps = require('./node_modules/@googlemaps/polyline-codec');

const fs = require('fs');
const bytes = fs.readFileSync(__dirname + '/polyline.wasm');
// const size = parseInt(process.argv[2]);

let memory = new WebAssembly.Memory({initial: 10000});
let importObj = {
    env: {
        buffer: memory
    }
};
let encoder = new TextEncoder('utf-8');

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

    console.log("n(points) wasm js");

[100, 1000, 10000, 50000, 100000, 500000, 1000000, 5000000].forEach((size) => {

    let coords = [];
    for (let i = 0; i < size; i++) {
        let lat = (Math.floor(Math.random() * 18000) - 9000) / 100;
        let lng = (Math.floor(Math.random() * 36000) - 18000) / 100;
        coords.push([lat, lng])
    }
    let str = maps.encode(coords, 5);

    let swasm = performance.now();
    const path = decodeWasm(obj, str);
    let ewasm = performance.now();

    let sjs = performance.now();
    const pathJS = maps.decode(str);
    let ejs = performance.now();

    console.log(size, ewasm - swasm, ejs - sjs);

})
})();
