const fs = require('fs');

const generator = require(`${__dirname}/generator`);

const implementation = process.argv[2];
const warmUpSize = process.argv[3];
const length = 1000;
const trace = process.argv[4];

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

    for (let i = 0; i < warmUpSize; i++) {
        const str = generator.generateRandomWalkPath(length);

        const result = decode(str);
        if (!result || result.length == 0) {
            throw new Error("bad result");
        }
    }

    const str = fs.readFileSync(`${__dirname}/${trace}`, 'utf8');
    const [result, time] = runBenchmark(decode, str);
    if (!result || result.length == 0) {
        throw new Error("bad result");
    }
    console.log(time);
})();
