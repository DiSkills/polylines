use crate::types::LatLng;

#[inline]
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

#[inline]
pub unsafe fn decode_line(
    encoded: *const u8, len: usize, factor: f64, path: *mut LatLng<f64>
) -> usize  {
    let mut i = 0;
    let mut coord = LatLng { lat: 0, lng: 0 };
    let mut index = 0;

    while i < len {
        coord.lat += decode_value(encoded, &mut i);
        coord.lng += decode_value(encoded, &mut i);

        *path.add(index) = LatLng {
            lat: coord.lat as f64 / factor,
            lng: coord.lng as f64 / factor,
        };
        index += 1;
    }
    index
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decode_single_value() {
        let s = "_p~iF";
        let mut index = 0;
        let result = unsafe {
            decode_value(s.as_bytes().as_ptr(), &mut index)
        };
        assert_eq!(result, 3850000);
        assert_eq!(index, s.len());
    }

    #[test]
    fn test_decode_two_values() {
        let s = "_p~iF~ps|U";
        let mut index = 0;

        let lat = unsafe {
            decode_value(s.as_bytes().as_ptr(), &mut index)
        };
        assert_eq!(lat, 3850000);
        assert_eq!(index, 5);

        let lng = unsafe {
            decode_value(s.as_bytes().as_ptr(), &mut index)
        };
        assert_eq!(lng, -12020000);
        assert_eq!(index, s.len());
    }

    #[test]
    fn test_decode_line() {
        let s = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
        let mut path = [LatLng { lat: 0.0, lng: 0.0 }; 3];
        let expected = [
            LatLng { lat: 38.5, lng: -120.2 },
            LatLng { lat: 40.7, lng: -120.95 },
            LatLng { lat: 43.252, lng: -126.453 },
        ];

        let len = unsafe {
            decode_line(
                s.as_bytes().as_ptr(), s.len(), 1e5, path.as_mut_ptr()
            )
        };
        assert_eq!(len, 3);
        for (p, e) in path.iter().zip(expected.iter()) {
            assert_eq!(p.lat, e.lat);
            assert_eq!(p.lng, e.lng);
        }
    }
}
