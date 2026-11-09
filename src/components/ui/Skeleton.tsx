import type { CSSProperties } from 'react'
import './Skeleton.css'

interface Props {
  width?: string | number
  height?: string | number
  radius?: 'sm' | 'md' | 'full'
  className?: string
  style?: CSSProperties
}

export default function Skeleton({ width, height, radius = 'sm', className = '', style }: Props) {
  return (
    <span
      className={`skeleton skeleton--radius-${radius} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}
