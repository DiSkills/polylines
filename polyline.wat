(module
  (import "env" "buffer" (memory 10000))

  (func $decode (export "decode") (param $path i32) (param $len i32) (param $factor i32)
    (result i32 i32)

    (local $res i32)
    (local $index i32)
    (local $lat i32)
    (local $lng i32)
    (local $pointIndex i32)
    (local $result i32)
    (local $shift i32)
    (local $b i32)

    (local.set $index (i32.const 0))
    (local.set $lat (i32.const 0))
    (local.set $lng (i32.const 0))
    (local.set $pointIndex (i32.const 0))

    local.get $path

    local.get $len
    i32.const 7
    i32.add
    i32.const 3
    i32.shr_u
    i32.const 3
    i32.shl

    i32.add
    local.set $res

    (loop $cycle_index (block $break_index
      local.get $index
      local.get $len
      i32.ge_u
      br_if $break_index

      (local.set $result (i32.const 1))
      (local.set $shift (i32.const 0))

      (loop $cycle_b
        local.get $path
        local.get $index
        i32.add
        i32.load8_u
        i32.const 64
        i32.sub
        local.set $b

        local.get $index
        i32.const 1
        i32.add
        local.set $index

        local.get $b
        local.get $shift
        i32.shl
        local.get $result
        i32.add
        local.set $result

        local.get $shift
        i32.const 5
        i32.add
        local.set $shift

        local.get $b
        i32.const 0x1f
        i32.ge_s
        br_if $cycle_b
      )

      local.get $result
      i32.const 1
      i32.and
      if
        local.get $result
        i32.const 1
        i32.shr_u
        i32.const 0xFFFFFFFF
        i32.xor

        local.get $lat
        i32.add
        local.set $lat
      else
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
        local.get $path
        local.get $index
        i32.add
        i32.load8_u
        i32.const 64
        i32.sub
        local.set $b

        local.get $index
        i32.const 1
        i32.add
        local.set $index

        local.get $b
        local.get $shift
        i32.shl
        local.get $result
        i32.add
        local.set $result

        local.get $shift
        i32.const 5
        i32.add
        local.set $shift

        local.get $b
        i32.const 0x1f
        i32.ge_s
        br_if $cycle_b
      )
      local.get $result
      i32.const 1
      i32.and
      if
        local.get $result
        i32.const 1
        i32.shr_u
        i32.const 0xFFFFFFFF
        i32.xor

        local.get $lng
        i32.add
        local.set $lng
      else
        local.get $result
        i32.const 1
        i32.shr_u

        local.get $lng
        i32.add
        local.set $lng
      end
      local.get $res
      local.get $pointIndex
      i32.add

      local.get $lat
      f64.convert_i32_s
      local.get $factor
      f64.convert_i32_s
      f64.div
      f64.store

      local.get $res
      local.get $pointIndex
      i32.add
      i32.const 8
      i32.add

      local.get $lng
      f64.convert_i32_s
      local.get $factor
      f64.convert_i32_s
      f64.div
      f64.store

      local.get $pointIndex
      i32.const 16
      i32.add
      local.set $pointIndex
      br $cycle_index
    ))
    local.get $res
    local.get $pointIndex
    i32.const 3
    i32.shr_u
  )
)
