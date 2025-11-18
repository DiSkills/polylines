const fs = require('fs');
const implementation = process.argv[2];

const js = require('@googlemaps/polyline-codec');
const wat = require(`${__dirname}/../wat/wrapper`);
const rust = require(`${__dirname}/../rust/wrapper`);

const data = fs.readFileSync(`${__dirname}/geopuzzle.json`);
const countries = JSON.parse(data).questions;

function runBenchmark(decode, countries) {
    const start = performance.now();
    const result = countries.map((country) => {
        return {
            id: country.id,
            name: country.name,
            paths: country.polygon.map((s) => decode(s)),
        };
    });
    const end = performance.now();
    return [result, end - start];
}

(async () => {
    await wat.init();
    await rust.init();

    const decode = {
        "wat": wat.decode, "rust": rust.decode, "js": js.decode,
    }[implementation];

    const [result, time] = runBenchmark(decode, countries);
    console.log(time);
})();
