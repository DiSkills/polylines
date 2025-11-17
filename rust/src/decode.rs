use crate::types::*;

#[inline]
fn decode_value(encoded: &mut EncodedStream) -> i32 {
    let mut result = 1;
    let mut shift = 0;
    let mut b: i32;
    loop {
        b = encoded.get() as i32 - 63 - 1;
        result += b << shift;
        shift += 5;
        if b < 0x1f {
            break;
        }
    }
    return if result & 1 != 0 { !(result >> 1) } else { result >> 1 };
}

#[inline]
pub fn decode_line(encoded: &mut EncodedStream, factor: f64, path: &mut Path) {
    let mut coord = LatLng { lat: 0, lng: 0 };

    while !encoded.is_empty() {
        coord.lat += decode_value(encoded);
        coord.lng += decode_value(encoded);

        path.push(&mut LatLng {
            lat: coord.lat as f64 / factor,
            lng: coord.lng as f64 / factor,
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decode_single_value() {
        let mut s = b"_p~iF".to_vec();
        let mut encoded = EncodedStream::new(s.as_mut_ptr(), s.len());

        let result = decode_value(&mut encoded);
        assert_eq!(result, 3850000);
    }

    #[test]
    fn test_decode_two_values() {
        let mut s = b"_p~iF~ps|U".to_vec();
        let mut encoded = EncodedStream::new(s.as_mut_ptr(), s.len());

        let lat = decode_value(&mut encoded);
        assert_eq!(lat, 3850000);
        let lng = decode_value(&mut encoded);
        assert_eq!(lng, -12020000);
    }

    #[test]
    fn test_decode_line() {
        let mut s = b"_p~iF~ps|U_ulLnnqC_mqNvxq`@".to_vec();
        let mut encoded = EncodedStream::new(s.as_mut_ptr(), s.len());

        let mut points = [LatLng { lat: 0.0, lng: 0.0 }; 3];
        let mut path = Path::new(points.as_mut_ptr(), 0);

        let expected = [
            LatLng { lat: 38.5, lng: -120.2 },
            LatLng { lat: 40.7, lng: -120.95 },
            LatLng { lat: 43.252, lng: -126.453 },
        ];

        decode_line(&mut encoded, 1e5, &mut path);
        assert_eq!(path.len(), 3);
        for (p, e) in points.iter().zip(expected.iter()) {
            assert_eq!(p.lat, e.lat);
            assert_eq!(p.lng, e.lng);
        }
    }
}
