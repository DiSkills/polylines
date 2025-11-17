const fs = require('fs');
const filename = `${__dirname}/target/wasm32-unknown-unknown/release/rust.wasm`;
const bytes = fs.readFileSync(filename);

let memory = null;
let instance = null;

async function init(mem = null) {
    if (!mem) {
        mem = new WebAssembly.Memory({ initial: 17 });
    }
    memory = mem;
    obj = await WebAssembly.instantiate(
        new Uint8Array(bytes), { env: { memory } },
    );
    instance = obj.instance;
}

function decode(str, factor = 1e5) {
    const encodedStr = new TextEncoder().encode(str);
    const encodedBuf = new Uint8Array(memory.buffer, 0, encodedStr.length);
    encodedBuf.set(encodedStr);

    const res = instance.exports.decode(0, encodedStr.length, factor);
    const len = new Uint32Array(memory.buffer, res - 8, 1)[0];

    const coordinates = new Float64Array(memory.buffer, res, len);
    const path = new Array(len >> 1);
    for (let i = 0, j = 0; i < len; j++, i += 2) {
        path[j] = [coordinates[i], coordinates[i + 1]];
    }
    return path;
}

module.exports = { init, decode };
