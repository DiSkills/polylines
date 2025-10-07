use crate::types::*;

#[inline]
fn encode_value(mut value: i32, encoded: &mut EncodedStream) {
    value = if value < 0 { !(value << 1) } else { value << 1 };
    while value >= 0x20 {
        encoded.put((0x20 | (value & 0x1f)) as u8 + 63);
        value >>= 5;
    }
    encoded.put(value as u8 + 63);
}

#[inline]
pub fn encode_line(path: &mut Path, factor: f64, encoded: &mut EncodedStream) {
    let mut prev = LatLng { lat: 0, lng: 0 };

    let mut i = 0;
    while i < path.len() {
        let point = path.get(i);
        let cur = LatLng {
            lat: (point.lat * factor) as i32, lng: (point.lng * factor) as i32,
        };

        encode_value(cur.lat - prev.lat, encoded);
        encode_value(cur.lng - prev.lng, encoded);

        i += 1;
        prev = cur;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_single_value() {
        let value = -17998321;
        let mut s = [0u8; 6];
        let expected: [u8; 6] = [96, 126, 111, 105, 97, 64];

        let mut encoded = EncodedStream::new(s.as_mut_ptr(), 0);
        encode_value(value, &mut encoded);
        assert_eq!(encoded.len(), s.len());
        assert_eq!(s, expected);
    }

    #[test]
    fn test_encode_two_values() {
        let mut value = 3850000;
        let mut s = [0u8; 10];
        let expected: [u8; 10] = [
            95, 112, 126, 105, 70, 126, 112, 115, 124, 85
        ];

        let mut encoded = EncodedStream::new(s.as_mut_ptr(), 0);
        encode_value(value, &mut encoded);
        assert_eq!(encoded.len(), 5);
        assert_eq!(s[..5], expected[..5]);

        value = -12020000;
        encode_value(value, &mut encoded);
        assert_eq!(encoded.len(), s.len());
        assert_eq!(s, expected);
    }

    #[test]
    fn test_encode_line() {
        let mut s = [0u8; 27];
        let mut points = [
            LatLng { lat: 38.5, lng: -120.2 },
            LatLng { lat: 40.7, lng: -120.95 },
            LatLng { lat: 43.252, lng: -126.453 },
        ];
        let expected: [u8; 27] = [
            95, 112, 126, 105, 70, 126, 112, 115, 124, 85, 95, 117, 108, 76,
            110, 110, 113, 67, 95, 109, 113, 78, 118, 120, 113, 96, 64,
        ];

        let mut encoded = EncodedStream::new(s.as_mut_ptr(), 0);
        let mut path = Path::new(points.as_mut_ptr(), points.len());
        encode_line(&mut path, 1e5, &mut encoded);
        assert_eq!(encoded.len(), s.len());
        assert_eq!(s, expected);
    }
}
