#![cfg(target_arch = "wasm32")]

use std::arch::wasm32::*;

#[inline]
fn sub64(arr: *mut v128, len: usize) {
    let blocks = len / 16;

    let mut i = 0;
    while i < blocks {
        unsafe {
            *arr.add(i) = i8x16_sub(*arr.add(i), i8x16_splat(64));
        }
        i += 1;
    }

    i *= 16;
    let array = arr as *mut i8;
    while i < len {
        unsafe {
            *array.add(i) -= 64;
        }
        i += 1;
    }
}

#[inline]
fn decode_value(encoded: *const i8, index: &mut usize) -> i32 {
    let mut result = 1;
    let mut shift = 0;
    let mut b: i32;
    loop {
        unsafe {
            b = *encoded.add(*index) as i32;
        }
        *index += 1;
        result += b << shift;
        shift += 5;
        if b < 0x1f {
            break;
        }
    }
    return if result & 1 != 0 { !(result >> 1) } else { result >> 1 };
}

#[inline]
fn decode_line(
    encoded: *const i8, len: usize, path: *mut v128, factor: f64,
) -> usize {
    sub64(encoded as *mut v128, len);

    let mut index = 0;
    let mut point = 0;

    let divisor = f64x2_splat(factor);
    unsafe {
        *path = f64x2(
            decode_value(encoded, &mut index) as f64,
            decode_value(encoded, &mut index) as f64,
        );
    }

    while index < len {
        unsafe {
            *path.add(point + 1) = f64x2_add(
                *path.add(point),
                f64x2(
                    decode_value(encoded, &mut index) as f64,
                    decode_value(encoded, &mut index) as f64,
                ),
            );
            *path.add(point) = f64x2_div(*path.add(point), divisor);
        }
        point += 1;
    }

    unsafe {
        *path.add(point) = f64x2_div(*path.add(point), divisor);
    }

    point + 1
}

#[no_mangle]
#[target_feature(enable = "simd128")]
pub fn decode(encoded: *mut i8, len: usize, factor: f64) -> *mut f64 {
    let path: *mut v128 = unsafe {
        encoded.add(((len + 7) & !7) + 8) as *mut v128
    };

    let path_len = if len > 0 {
        decode_line(encoded, len, path, factor)
    } else {
        0
    };

    let res = path as *mut f64;
    unsafe {
        *(res.sub(1) as *mut usize) = path_len * 2;
    }
    res
}
