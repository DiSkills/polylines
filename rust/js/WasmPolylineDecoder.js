const WASM_DEFAULT_MEMORY_SIZE = 16;
const DEFAULT_FACTOR = 1e5;

class WasmPolylineDecoder {
    constructor(bytes, memory) {
        if (memory === undefined) {
            memory = new WebAssembly.Memory({initial: WASM_DEFAULT_MEMORY_SIZE});
        }
        this.memory = memory;

        const module = new WebAssembly.Module(bytes);
        this.instance = new WebAssembly.Instance(module, {env: {memory}});
    }

    decode(str, factor = DEFAULT_FACTOR) {
        const encodedStr = new TextEncoder().encode(str);
        const encodedBuf = new Uint8Array(this.memory.buffer, 0, encodedStr.length);
        encodedBuf.set(encodedStr);

        const res = this.instance.exports.decode(0, encodedStr.length, factor);
        const len = new Uint32Array(this.memory.buffer, res - 8, 1)[0];

        const coordinates = new Float64Array(this.memory.buffer, res, len);
        const path = new Array(len >> 1);
        for (let i = 0, j = 0; i < len; j++, i += 2) {
            path[j] = [coordinates[i], coordinates[i + 1]];
        }
        return path;
    }
}

module.exports = {WasmPolylineDecoder};
