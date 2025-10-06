mod types;
mod decode;

use crate::types::LatLng;

#[no_mangle]
pub unsafe
fn decode(encoded: *const u8, len: usize, factor: f64) -> *mut LatLng<f64> {
    let path = encoded.add(((len + 7) & !7) + 8) as *mut LatLng<f64>;
    let size = decode::decode_line(encoded, len, factor, path);
    *((path as *mut f64).sub(1) as *mut usize) = size << 1;
    path
}
