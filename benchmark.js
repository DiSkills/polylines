const fs = require('fs');
const codec = require('@googlemaps/polyline-codec');
const RustWrapper = require(__dirname + '/RustWrapper');

const testUrl = "https://geopuzzle.org/puzzle/world/questions/";

const memory = new WebAssembly.Memory({ initial: 17 });
const rustFilename = __dirname + '/rust/polylines/target/wasm32-unknown-unknown/release/polylines.wasm';

function runBenchmark(json, callback) {
    const start = performance.now();
    const result = json.questions.map((question) => {
        return {
            id: question.id,
            name: question.name,
            paths: question.polygon.map((str) => (callback(str)))
        };
    });
    const end = performance.now();
    return [result, end - start];
}

function checkPath(r1, r2) {
    for (let i = 0; i < r1.length; i++) {
        if (r1[i][0] != r2[i][0] || r1[i][1] != r2[i][1]) {
            console.log(r1[i], r2[i]);
            return false;
        }
    }
    return true;
}

function checkPaths(r1, r2) {
    for (let i = 0; i < r1.length; i++) {
        if (!checkPath(r1[i], r2[i])) {
            console.log(r1[i], r2[i]);
            return false;
        }
    }
    return true;
}

function checkResult(r1, r2) {
    for (let i = 0; i < r1.length; i++) {
        if (r1[i].id != r2[i].id || r1[i].name != r2[i].name || !checkPaths(r1[i].paths, r2[i].paths)) {
            console.log(r1[i].name, r2[i].name);
            process.exit(1);
        }
    }
}

(async () => {
    const rust = await RustWrapper.create(rustFilename, memory);

    const response = await fetch(testUrl);
    const json = await response.json();

    const [rustResult, rustTime] = runBenchmark(json, (str) => rust.decode(str));
    const [jsResult, jsTime] = runBenchmark(json, codec.decode);
    checkResult(rustResult, jsResult);

    console.log(`Rust=${rustTime}, Js=${jsTime}`);
})();
