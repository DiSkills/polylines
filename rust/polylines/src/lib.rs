mod types;
mod decode;
mod encode;
mod simd;

use crate::types::*;

#[no_mangle]
pub unsafe
fn decode(encoded: *mut u8, len: usize, factor: f64) -> *mut LatLng<f64> {
    let points = encoded.add(((len + 7) & !7) + 8) as *mut LatLng<f64>;

    let mut path = Path::new(points, 0);
    decode::decode_line(
        &mut EncodedStream::new(encoded, len), factor, &mut path,
    );
    *((points as *mut f64).sub(1) as *mut usize) = path.len() << 1;
    points
}

#[no_mangle]
pub unsafe
fn encode(points: *mut LatLng<f64>, len: usize, factor: f64) -> *mut u8 {
    let s = (points.add(len) as *mut u8).add(4);

    let mut encoded = EncodedStream::new(s, 0);
    let mut path = Path::new(points, len);
    encode::encode_line(&mut path, factor, &mut encoded);
    *(s as *mut usize).sub(1) = encoded.len();
    s
}
