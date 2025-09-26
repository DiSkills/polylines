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

(async () => {
    let objWat = await WebAssembly.instantiate(new Uint8Array(bytesWat), importObj);
    let objRust = await WebAssembly.instantiate(new Uint8Array(bytesRust), importObj);

    const n = 10;

    console.log("n(points) wasm rust js");
    [10, 50, 70, 100, 150, 200, 300, 500, 700, 1000, 2000, 3000, 5000, 10000, 50000, 100000, 500000].forEach((size) => {
        let wsum = 0, jsum = 0, rsum = 0;

        for (let k = 0; k < n; k++) {
            let coords = [];
            for (let i = 0; i < size; i++) {
                let lat = (Math.floor(Math.random() * 18000) - 9000) / 100;
                let lng = (Math.floor(Math.random() * 36000) - 18000) / 100;
                coords.push([lat, lng])
            }
            let str = codec.encode(coords, 5);

            let srust = performance.now();
            const pathRust = decodeRust(objRust, str);
            let erust = performance.now();

            let swasm = performance.now();
            const path = decodeWasm(objWat, str);
            let ewasm = performance.now();

            let sjs = performance.now();
            const pathJS = codec.decode(str);
            let ejs = performance.now();

            for (let i = 0; i < size; i++) {
                if ((path[i][0] !== pathJS[i][0]) || (path[i][1] !== pathJS[i][1])) {
                    console.log(i);
                    console.log(path);
                    console.log(pathJS);
                    process.exit(1);
                }
                if ((pathRust[i][0] !== pathJS[i][0]) || (pathRust[i][1] !== pathJS[i][1])) {
                    console.log(i);
                    console.log(pathRust);
                    console.log(pathJS);
                    process.exit(1);
                }
            }

            wsum += ewasm - swasm;
            jsum += ejs - sjs;
            rsum += erust - srust;
        }
        console.log(size, wsum / n, rsum / n, jsum / n);
    })
})();
