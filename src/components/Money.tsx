import { rupiah } from '@/lib/format'

export const Money = ({ value }: { value: number }) => <span>{rupiah(value)}</span>
