const fs = require('fs');
const codec = require('@googlemaps/polyline-codec');
const RustWrapper = require(__dirname + '/RustWrapper');

const memory = new WebAssembly.Memory({ initial: 10000 });
const rustFilename = __dirname + '/rust/polylines/target/wasm32-unknown-unknown/release/polylines.wasm';

function runBenchmark(str, callback) {
    const start = performance.now();
    const result = callback(str);
    const end = performance.now();
    return [result, end - start];
}

function checkResult(r1, r2) {
    for (let i = 0; i < r1.length; i++) {
        if (r1[i][0] != r2[i][0] || r1[i][1] != r2[i][1]) {
            console.log(i);
            console.log(r1[i], r2[i]);
            console.log(r1, r2);
            process.exit(1);
        }
    }
}

(async () => {
    const rust = await RustWrapper.create(rustFilename, memory);

    [10, 50, 70, 100, 150, 200, 300, 500, 700, 1000, 2000, 3000, 5000, 10000, 50000, 100000, 500000].forEach((size) => {
        const coords = [];
        for (let i = 0; i < size; i++) {
            const lat = (Math.floor(Math.random() * 18000) - 9000) / 100;
            const lng = (Math.floor(Math.random() * 36000) - 18000) / 100;
            coords.push([lat, lng])
        }
        const str = codec.encode(coords, 5);

        const [rustResult, rustTime] = runBenchmark(str, (str) => rust.decode(str));
        const [jsResult, jsTime] = runBenchmark(str, codec.decode);
        checkResult(rustResult, jsResult);
        console.log(`n=${size}, Rust=${rustTime}, Js=${jsTime}`);
    });
})();
