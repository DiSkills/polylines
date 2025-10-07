#![cfg(target_arch = "wasm32")]

use std::arch::wasm32::*;

#[inline]
unsafe fn simd_sub_64(arr: *mut v128, len: usize) {
    let blocks = len >> 4;

    let mut i = 0;
    while i < blocks {
        *arr.add(i) = i8x16_sub(*arr.add(i), i8x16_splat(64));
        i += 1;
    }

    i <<= 4;
    let array = arr as *mut i8;
    while i < len {
        *array.add(i) -= 64;
        i += 1;
    }
}

#[inline]
unsafe fn simd_get_offset(encoded: *const i8, index: &mut usize) -> i32 {
    let mut result = 1;
    let mut shift = 0;
    let mut b: i32;
    loop {
        b = *encoded.add(*index) as i32;
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
#[target_feature(enable = "simd128")]
pub unsafe
fn decode_simd(encoded: *mut i8, len: usize, factor: f64) -> *mut f64 {
    simd_sub_64(encoded as *mut v128, len);
    let path: *mut v128 = encoded.add(((len + 7) & !7) + 8) as *mut v128;

    let mut index = 0;
    let mut point_index = 0;
    *path = f64x2(
        simd_get_offset(encoded, &mut index) as f64,
        simd_get_offset(encoded, &mut index) as f64,
    );
    while index < len {
        *path.add(point_index + 1) = f64x2_add(
            *path.add(point_index),
            f64x2(
                simd_get_offset(encoded, &mut index) as f64,
                simd_get_offset(encoded, &mut index) as f64,
            ),
        );
        *path.add(point_index) = f64x2_div(*path.add(point_index), f64x2_splat(factor));
        point_index += 1;
    }
    *path.add(point_index) = f64x2_div(*path.add(point_index), f64x2_splat(factor));
    point_index += 1;

    *((path as *mut f64).sub(1) as *mut usize) = point_index << 1;
    path as *mut f64
}
