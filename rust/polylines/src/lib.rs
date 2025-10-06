mod types;
mod decode;
mod encode;
mod simd;

use crate::types::LatLng;

#[no_mangle]
pub unsafe
fn decode(encoded: *const u8, len: usize, factor: f64) -> *mut LatLng<f64> {
    let path = encoded.add(((len + 7) & !7) + 8) as *mut LatLng<f64>;
    let size = decode::decode_line(encoded, len, factor, path);
    *((path as *mut f64).sub(1) as *mut usize) = size << 1;
    path
}

#[no_mangle]
pub unsafe
fn encode(path: *const LatLng<f64>, len: usize, factor: f64) -> *mut u8 {
    let encoded = (path.add(len) as *mut u8).add(4);
    let size = encode::encode_line(path, len, factor, encoded);
    *(encoded as *mut usize).sub(1) = size;
    encoded
}
