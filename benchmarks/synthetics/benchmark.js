const fs = require('fs');

const generator = require(`${__dirname}/../generator`);
const generators = [
    generator.generateCompletelyRandomPath,
    generator.generateStraightPath,
    generator.generateRandomWalkPath,
];

const implementation = process.argv[2];
const warmUpSize = parseInt(process.argv[3]);
const sampleSize = parseInt(process.argv[4]);
const length = parseInt(process.argv[5]);

const js = require('@googlemaps/polyline-codec');
const wat = require(`${__dirname}/../../wat/wrapper`);
const rust = require(`${__dirname}/../../rust/wrapper`);

function runBenchmark(decode, str) {
    const start = performance.now();
    const result = decode(str);
    const end = performance.now();
    return [result, end - start];
}

function collect(decode, sampleSize, length) {
    let s = 0;
    generators.forEach((generate) => {
        for (let i = 0; i < sampleSize; i++) {
            const str = generate(length);

            const [result, time] = runBenchmark(decode, str);
            if (!result || result.length == 0) {
                throw new Error("bad result");
            }
            s += time;
        }
    });
    return s / (generators.length * sampleSize);
}

(async () => {
    await wat.init();
    await rust.init();

    const decode = {
        "wat": wat.decode, "rust": rust.decode, "js": js.decode,
    }[implementation];

    generators.forEach((generate) => {
        for (let i = 0; i < warmUpSize; i++) {
            const str = generate(length);

            const result = decode(str);
            if (!result || result.length == 0) {
                throw new Error("bad result");
            }
        }
    });

    console.log(collect(decode, sampleSize, length));
})();
