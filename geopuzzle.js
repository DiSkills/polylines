const fs = require('fs');
const codec = require('@googlemaps/polyline-codec');
const rust = require(`${__dirname}/RustWrapper`);

const data = fs.readFileSync(`${__dirname}/geopuzzle.json`);
const json = JSON.parse(data);

function checkPath(p1, p2) {
    for (let i = 0; i < p1.length; i++) {
        if (p1[i][0] != p2[i][0] || p1[i][1] != p2[i][1]) {
            console.log(p1[i], p2[i]);
            return false;
        }
    }
    return p1.length === p2.length;
}

function checkPaths(l1, l2) {
    for (let i = 0; i < l1.length; i++) {
        if (!checkPath(l1[i], l2[i])) {
            console.log(l1[i], l2[i]);
            return false;
        }
    }
    return l1.length === l2.length;
}

function checkResult(r1, r2) {
    for (let i = 0; i < r1.length; i++) {
        if (r1[i].id != r2[i].id || !checkPaths(r1[i].paths, r2[i].paths)) {
            console.log(r1[i].name, r2[i].name);
            process.exit(1);
        }
    }
}

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

(async () => {
    await rust.init();

    const [jsResult, jsTime] = runBenchmark(json, codec.decode);
    const [simdResult, simdTime] = runBenchmark(json, rust.decode_simd);
    const [rustResult, rustTime] = runBenchmark(json, rust.decode);

    checkResult(simdResult, jsResult);
    checkResult(rustResult, jsResult);
    console.log(`Simd=${simdTime}, Rust=${rustTime}, Js=${jsTime}`);
})();
