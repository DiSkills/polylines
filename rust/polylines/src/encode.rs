use crate::types::LatLng;

#[inline]
unsafe fn encode_value(mut value: i32, encoded: *mut u8, index: &mut usize) {
    value = if value < 0 { !(value << 1) } else { value << 1 };
    while value >= 0x20 {
        *encoded.add(*index) = (0x20 | (value & 0x1f)) as u8 + 63;
        value >>= 5;
        *index += 1;
    }
    *encoded.add(*index) = value as u8 + 63;
    *index += 1;
}

#[inline]
pub unsafe fn encode_line(
    path: *const LatLng<f64>, len: usize, factor: f64, encoded: *mut u8
) -> usize {
    let mut i = 0;
    let mut prev = LatLng { lat: 0, lng: 0 };
    let mut index = 0;

    while i < len {
        let cur = LatLng {
            lat: ((*path.add(i)).lat * factor) as i32,
            lng: ((*path.add(i)).lng * factor) as i32,
        };

        encode_value(cur.lat - prev.lat, encoded, &mut index);
        encode_value(cur.lng - prev.lng, encoded, &mut index);

        i += 1;
        prev = cur;
    }
    index
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_single_value() {
        let value = -17998321;
        let mut encoded = [0u8; 6];
        let mut index = 0;
        let expected: [u8; 6] = [96, 126, 111, 105, 97, 64];

        unsafe {
            encode_value(value, encoded.as_mut_ptr(), &mut index)
        };
        assert_eq!(index, encoded.len());
        assert_eq!(encoded, expected);
    }

    #[test]
    fn test_encode_two_values() {
        let mut value = 3850000;
        let mut encoded = [0u8; 10];
        let mut index = 0;
        let expected: [u8; 10] = [
            95, 112, 126, 105, 70, 126, 112, 115, 124, 85
        ];

        unsafe {
            encode_value(value, encoded.as_mut_ptr(), &mut index)
        };
        assert_eq!(index, 5);
        assert_eq!(encoded[..5], expected[..5]);

        value = -12020000;
        unsafe {
            encode_value(value, encoded.as_mut_ptr(), &mut index)
        };
        assert_eq!(index, encoded.len());
        assert_eq!(encoded, expected);
    }

    #[test]
    fn test_encode_line() {
        let mut encoded = [0u8; 27];
        let path = [
            LatLng { lat: 38.5, lng: -120.2 },
            LatLng { lat: 40.7, lng: -120.95 },
            LatLng { lat: 43.252, lng: -126.453 },
        ];
        let expected: [u8; 27] = [
            95, 112, 126, 105, 70, 126, 112, 115, 124, 85, 95, 117, 108, 76,
            110, 110, 113, 67, 95, 109, 113, 78, 118, 120, 113, 96, 64,
        ];

        let len = unsafe {
            encode_line(
                path.as_ptr(), path.len(), 1e5, encoded.as_mut_ptr()
            )
        };
        assert_eq!(len, encoded.len());
        assert_eq!(encoded, expected);
    }
}
