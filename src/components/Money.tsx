import { rupiah } from '@/lib/format'

export const Money = ({ value, className }: { value: number; className?: string }) => (
  <span className={`money${className ? ` ${className}` : ''}`}>{rupiah(value)}</span>
)
