#[derive(Clone, Copy)]
pub struct LatLng<T> {
    pub lat: T,
    pub lng: T,
}

pub struct EncodedStream {
    p: *mut u8,
    index: usize,
    len: usize,
}

impl EncodedStream {
    pub fn new(p: *mut u8, len: usize) -> Self {
        EncodedStream { p: p, index: 0, len: len }
    }

    pub fn get(&mut self) -> u8 {
        let res = unsafe { *self.p.add(self.index) };
        self.index += 1;
        return res;
    }

    pub fn put(&mut self, value: u8) {
        unsafe {
            *self.p.add(self.len) = value;
            self.len += 1;
        }
    }

    pub fn len(&mut self) -> usize {
        self.len
    }

    pub fn is_empty(&mut self) -> bool {
        self.index >= self.len
    }
}

pub struct Path {
    p: *mut LatLng<f64>,
    len: usize,
}

impl Path {
    pub fn new(p: *mut LatLng<f64>, len: usize) -> Self {
        Path { p: p, len: len }
    }

    pub fn get(&mut self, index: usize) -> &mut LatLng<f64> {
        unsafe { &mut *self.p.add(index) }
    }

    pub fn push(&mut self, item: &mut LatLng<f64>) {
        unsafe {
            *self.p.add(self.len) = *item;
            self.len += 1;
        }
    }

    pub fn len(&mut self) -> usize {
        self.len
    }
}
