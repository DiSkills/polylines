#![cfg(target_arch = "wasm32")]

use std::arch::wasm32::*;

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
fn decode(encoded: *const u8, len: usize, factor: f64) -> *mut f64  {
    let path: *mut f64 = encoded.add(((len + 7) & !7) + 8) as *mut f64;

    let mut index = 0;
    let mut lat = 0;
    let mut lng = 0;
    let mut point_index = 0;

    while index < len {
        lat += decode_value(encoded, &mut index);
        lng += decode_value(encoded, &mut index);

        *path.add(point_index) = (lat as f64) / factor;
        *path.add(point_index + 1) = (lng as f64) / factor;

        point_index += 2;
    }
    *(path.sub(1) as *mut usize) = point_index;
    path
}

#[inline(always)]
unsafe fn simd_sub_64(arr: *mut v128, len: usize) {
    let mut i = 0;
    while i < len {
        *arr.add(i) = i8x16_sub(*arr.add(i), i8x16_splat(64));
        i += 1;
    }
}

#[inline(always)]
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
pub unsafe extern "C"
fn decode_simd(encoded: *mut i8, len: usize, factor: f64) -> *mut f64 {
    simd_sub_64(encoded as *mut v128, (len + 15) >> 4);
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
