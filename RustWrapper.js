const fs = require('fs');

class RustWrapper {
    constructor(obj, memory) {
        this.memory = memory;
        this.obj = obj;
        this.encoder = new TextEncoder();
    }

    static async create(filename, memory) {
        if (memory === null) {
            memory = new WebAssembly.Memory({ initial: 17 });
        }
        const bytes = fs.readFileSync(filename);
        const obj = await WebAssembly.instantiate(
            new Uint8Array(bytes), { env: { memory: memory } }
        )
        return new RustWrapper(obj, memory);
    }

    decode(str) {
        const line = this.encoder.encode(str);
        const encoded = new Uint8Array(this.memory.buffer, 0, line.length);
        encoded.set(line);

        const res = this.obj.instance.exports.decode(0, line.length, 100000);
        const len = new Uint32Array(this.memory.buffer, res - 8, 1)[0];

        const b = new Float64Array(this.memory.buffer, res, len);
        const path = new Array(len >> 1);
        for (let i = 0, j = 0; i < len; j++, i += 2) {
            path[j] = [b[i], b[i + 1]];
        }
        return path;
    }

    decode_simd(str) {
        const line = this.encoder.encode(str);
        const encoded = new Uint8Array(this.memory.buffer, 0, line.length);
        encoded.set(line);

        const res = this.obj.instance.exports.decode_simd(0, line.length, 100000);
        const len = new Uint32Array(this.memory.buffer, res - 8, 1)[0];

        const b = new Float64Array(this.memory.buffer, res, len);
        const path = new Array(len >> 1);
        for (let i = 0, j = 0; i < len; j++, i += 2) {
            path[j] = [b[i], b[i + 1]];
        }
        return path;
    }
}

module.exports = RustWrapper;
