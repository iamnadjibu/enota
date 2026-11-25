import React from 'react'
import markDark from '../brand/logo-mark-dark.png'
import lockupDark from '../brand/logo-lockup-dark.png'
import fullDark from '../brand/logo-full-dark.png'

/**
 * eNOTA logo for dark backgrounds.
 *  variant="mark"   – the X symbol only
 *  variant="lockup" – symbol + wordmark side by side (headers)
 *  variant="full"   – symbol above wordmark (hero, login cards)
 */
export default function Logo({ variant = 'lockup', className = '', label = 'eNOTA Portal' }) {
  const src = variant === 'mark' ? markDark : variant === 'full' ? fullDark : lockupDark
  return <img src={src} alt={label} className={`select-none ${className}`} draggable="false" />
}

export { markDark as logoMarkDark }
