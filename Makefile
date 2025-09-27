RUST_DIR=rust/polylines
TARGET=$(RUST_DIR)/target/wasm32-unknown-unknown/release/polylines.wasm

all: run

$(TARGET): $(RUST_DIR)/src/lib.rs
	cd $(RUST_DIR) && cargo build --target=wasm32-unknown-unknown --release

run: benchmark.js $(TARGET)
	node $<

test: polyline.js $(TARGET)
	node $<

clean:
	rm -rf $(RUST_DIR)/target
