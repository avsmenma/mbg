'use client'

import { CSSProperties } from 'react'

interface Props {
  className?: string
  label?: string
  style?: CSSProperties
}

export function DeleteButton({ className, label = 'Hapus', style }: Props) {
  return (
    <button
      type="submit"
      className={className ?? 'bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors'}
      style={style}
      onClick={(e) => {
        if (!confirm('Hapus data ini? Tindakan ini tidak dapat dibatalkan.')) {
          e.preventDefault()
        }
      }}
    >
      {label}
    </button>
  )
}
