const fs = require('fs');
const {WasmPolylineDecoder} = require('./WasmPolylineDecoder');
const filename = `${__dirname}/../target/wasm32-unknown-unknown/release/rust.wasm`

class NodeJSPolylineDecoder {
    constructor(memory) {
        if (!!NodeJSPolylineDecoder.instance) {
            return NodeJSPolylineDecoder.instance;
        }
        const bytes = fs.readFileSync(filename);
        NodeJSPolylineDecoder.instance = new WasmPolylineDecoder(new Uint8Array(bytes), memory);
        return NodeJSPolylineDecoder.instance;
    }
}

module.exports = {NodeJSPolylineDecoder}
