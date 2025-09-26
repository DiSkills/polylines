(module
  (import "env" "memory" (memory 10000))

  (func $decode (export "decode")
    (param $encodedPath i32) (param $len i32) (param $factor i32)
    (result i32 i32)

    (local $path i32)

    (local $lat i32)
    (local $lng i32)

    (local $result i32)
    (local $shift i32)
    (local $b i32)

    (local $p i32)
    (local $end i32)
    (local $point i32)

    (local.set $lat (i32.const 0))
    (local.set $lng (i32.const 0))

    ;; Ближайшее к len число (справа), которое кратно 8
    local.get $len
    i32.const 7
    i32.add
    i32.const 3
    i32.shr_u
    i32.const 3
    i32.shl
    ;; path = encodedPath + (len + 7) // 8 * 8
    local.get $encodedPath
    i32.add
    local.tee $path
    ;; point = path
    local.set $point

    (local.set $p (local.get $encodedPath))
    (local.set $end (i32.add (local.get $encodedPath) (local.get $len)))
    (loop $cycle_index (block $break_index
      ;; p >= end
      local.get $p
      local.get $end
      i32.ge_u
      br_if $break_index

      (local.set $result (i32.const 1))
      (local.set $shift (i32.const 0))

      (loop $cycle_b
        ;; b = *p - 64
        local.get $p
        i32.load8_u
        i32.const 64
        i32.sub
        local.tee $b
        ;; result += b << shift
        local.get $shift
        i32.shl
        local.get $result
        i32.add
        local.set $result
        ;; shift += 5
        local.get $shift
        i32.const 5
        i32.add
        local.set $shift
        ;; p += 1
        local.get $p
        i32.const 1
        i32.add
        local.set $p
        ;; b >= 0x1f
        local.get $b
        i32.const 0x1f
        i32.ge_s
        br_if $cycle_b
      )

      ;; result & 1
      local.get $result
      i32.const 1
      i32.and
      if
        ;; lat += ~(result >> 1)
        local.get $result
        i32.const 1
        i32.shr_u
        i32.const 0xFFFFFFFF
        i32.xor

        local.get $lat
        i32.add
        local.set $lat
      else
        ;; lat += result >> 1
        local.get $result
        i32.const 1
        i32.shr_u

        local.get $lat
        i32.add
        local.set $lat
      end

      (local.set $result (i32.const 1))
      (local.set $shift (i32.const 0))

      (loop $cycle_b
        ;; b = *p - 64
        local.get $p
        i32.load8_u
        i32.const 64
        i32.sub
        local.tee $b
        ;; result += b << shift
        local.get $shift
        i32.shl
        local.get $result
        i32.add
        local.set $result
        ;; shift += 5
        local.get $shift
        i32.const 5
        i32.add
        local.set $shift
        ;; p += 1
        local.get $p
        i32.const 1
        i32.add
        local.set $p
        ;; b >= 0x1f
        local.get $b
        i32.const 0x1f
        i32.ge_s
        br_if $cycle_b
      )

      ;; result & 1
      local.get $result
      i32.const 1
      i32.and
      if
        ;; lng += ~(result >> 1)
        local.get $result
        i32.const 1
        i32.shr_u
        i32.const 0xFFFFFFFF
        i32.xor

        local.get $lng
        i32.add
        local.set $lng
      else
        ;; lng += result >> 1
        local.get $result
        i32.const 1
        i32.shr_u

        local.get $lng
        i32.add
        local.set $lng
      end

      ;; *point = lat / factor
      local.get $point
      local.get $lat
      f64.convert_i32_s
      local.get $factor
      f64.convert_i32_s
      f64.div
      f64.store

      ;; *(point + 1) = lng / factor
      local.get $point
      i32.const 8
      i32.add

      local.get $lng
      f64.convert_i32_s
      local.get $factor
      f64.convert_i32_s
      f64.div
      f64.store

      ;; point += 2
      local.get $point
      i32.const 16
      i32.add
      local.set $point
      br $cycle_index
    ))

    local.get $path

    ;; (point - path) / 8
    local.get $point
    local.get $path
    i32.sub
    i32.const 3
    i32.shr_u
  )
)
