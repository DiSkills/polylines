const Benchmark = require('benchmark');
const suite = new Benchmark.Suite;

const fs = require('fs');
const codec = require('@googlemaps/polyline-codec');
const rust = require(`${__dirname}/RustWrapper`);

const data = fs.readFileSync(`${__dirname}/geopuzzle.json`);
const json = JSON.parse(data);

function run(json, callback) {
    return json.questions.map((question) => {
        return {
            id: question.id,
            name: question.name,
            paths: question.polygon.map((str) => (callback(str)))
        };
    });
}

(async () => {
    await rust.init();

    suite.add('JavaScript', () => { run(json, codec.decode); });
    suite.add('Simd', () => { run(json, rust.decode_simd); });
    suite.add('Rust', () => { run(json, rust.decode); });

    suite.on('cycle', (event) => {
        console.log(String(event.target));
    });
    suite.on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        console.log('Slowest is ' + this.filter('slowest').map('name'));
    });
    suite.run({ 'async': false });
})();
