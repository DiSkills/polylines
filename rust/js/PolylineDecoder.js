import {WasmPolylineDecoder} from "./WasmPolylineDecoder.js";

const WASM_URL = "/target/wasm32-unknown-unknown/release/rust.wasm";

class PolylineDecoder {
    static async create(memory) {
        if (!!PolylineDecoder.instance) {
            return PolylineDecoder.instance;
        }
        const bytes = await this.fetchWasm(WASM_URL);
        PolylineDecoder.instance = new WasmPolylineDecoder(bytes, memory);
        return PolylineDecoder.instance;
    }

    static async fetchWasm(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load WASM file: ${url}`)
        }
        return await response.arrayBuffer();
    }
}

export {PolylineDecoder};
