mod decode;
mod types;

use crate::types::*;

#[no_mangle]
pub fn decode(encoded: *mut u8, len: usize, factor: f64) -> *mut LatLng<f64> {
    let points = unsafe { encoded.add(((len + 7) & !7) + 8) as *mut LatLng<f64> };

    let mut path = Path::new(points, 0);
    decode::decode_line(&mut EncodedStream::new(encoded, len), factor, &mut path);

    unsafe {
        *((points as *mut f64).sub(1) as *mut usize) = path.len() << 1;
    }
    points
}
