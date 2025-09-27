#![cfg(target_arch = "wasm32")]

#[inline(always)]
unsafe fn decode_value(encoded: *const u8, index: &mut usize) -> i32 {
    let mut result = 1;
    let mut shift = 0;
    let mut b: i32;
    loop {
        b = *encoded.add(*index) as i32 - 63 - 1;
        *index += 1;
        result += b << shift;
        shift += 5;
        if b < 0x1f {
            break;
        }
    }
    return if result & 1 != 0 { !(result >> 1) } else { result >> 1 };
}

#[no_mangle]
pub unsafe extern "C"
fn decode(encoded: *const u8, len: usize, factor: i32) -> *mut f64  {
    let path: *mut f64 = encoded.add(((len + 7) & !7) + 8) as *mut f64;

    let mut index = 0;
    let mut lat = 0;
    let mut lng = 0;
    let mut point_index = 0;

    while index < len {
        lat += decode_value(encoded, &mut index);
        lng += decode_value(encoded, &mut index);

        *path.add(point_index) = (lat as f64) / (factor as f64);
        *path.add(point_index + 1) = (lng as f64) / (factor as f64);

        point_index += 2;
    }
    *(path.sub(1) as *mut usize) = point_index;
    path
}
