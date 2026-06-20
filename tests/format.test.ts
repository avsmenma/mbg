import { describe, it, expect } from 'vitest'
import { rupiah } from '@/lib/format'

describe('rupiah', () => {
  it('format ribuan', () => { expect(rupiah(1020000)).toBe('Rp 1.020.000') })
  it('nol & non-finite', () => { expect(rupiah(NaN)).toBe('Rp 0') })
})
