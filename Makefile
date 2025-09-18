build: dependencies polyline.wasm

run: polyline.js polyline.wasm
	node $<

dependencies:
	npm install

polyline.wasm: polyline.wat
	wat2wasm $<

clean:
	rm polyline.wasm
