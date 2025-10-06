const fs = require('fs');
const filename = `${__dirname}/rust/polylines/target/wasm32-unknown-unknown/release/polylines.wasm`;
const bytes = fs.readFileSync(filename);

let memory, obj;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function init(mem) {
    if (arguments.length === 0) {
        mem = new WebAssembly.Memory({ initial: 17 });
    }
    memory = mem;
    obj = await WebAssembly.instantiate(
        new Uint8Array(bytes), { env: { memory } }
    )
}

function run(str, func) {
    const line = encoder.encode(str);
    const encoded = new Uint8Array(memory.buffer, 0, line.length);
    encoded.set(line);

    const res = func(0, line.length, 100000);
    const len = new Uint32Array(memory.buffer, res - 8, 1)[0];

    const b = new Float64Array(memory.buffer, res, len);
    const path = new Array(len >> 1);
    for (let i = 0, j = 0; i < len; j++, i += 2) {
        path[j] = [b[i], b[i + 1]];
    }
    return path;
}

function decode(str) {
    return run(str, obj.instance.exports.decode);
}

function decode_simd(str) {
    return run(str, obj.instance.exports.decode_simd);
}

function encode(arr) {
    const b = new Float64Array(memory.buffer, 0, arr.length << 1);
    for (let i = 0, j = 0; i < arr.length; i++, j += 2) {
        b[j] = arr[i][0];
        b[j + 1] = arr[i][1];
    }
    const res = obj.instance.exports.encode(0, arr.length, 100000);
    const len = new Uint32Array(memory.buffer, res - 4, 1)[0];

    const encoded = new Uint8Array(memory.buffer, res, len);
    return decoder.decode(encoded);
}

module.exports = { decode, decode_simd, init, encode };
