const fs = require('fs');

const generator = require(`${__dirname}/generator`);

const implementation = process.argv[2];
const size = process.argv[3];
const gentype = process.argv[4];
const n = process.argv[5];

const js = require('@googlemaps/polyline-codec');
const wat = require(`${__dirname}/../wat/wrapper`);
const rust = require(`${__dirname}/../rust/wrapper`);

function runBenchmark(decode, str) {
    const start = performance.now();
    const result = decode(str);
    const end = performance.now();
    return [result, end - start];
}

(async () => {
    await wat.init();
    await rust.init();

    const decode = {
        "wat": wat.decode, "rust": rust.decode, "js": js.decode,
    }[implementation];

    const generate = {
        "random": generator.generateCompletelyRandomPath,
        "walk": generator.generateRandomWalkPath,
        "straight": generator.generateStraightPath,
    }[gentype];

    let s = 0;
    for (let i = 0; i < size; i++) {
        const str = generate(n);
        const [result, time] = runBenchmark(decode, str);
        s += time;
    }

    if (s >= 0) {
        const str = generate(n);
        const [result, time] = runBenchmark(decode, str);
        console.log(time);
    }
})();
