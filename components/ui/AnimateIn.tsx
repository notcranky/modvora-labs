'use client'

import { useEffect, useRef, type ReactNode, type ElementType } from 'react'

type Variant = 'up' | 'left' | 'right' | 'zoom'

interface AnimateInProps {
  children: ReactNode
  /** Extra Tailwind / CSS classes for the wrapper */
  className?: string
  /** Animation direction */
  variant?: Variant
  /** Delay in milliseconds before the transition starts */
  delay?: number
  /** IntersectionObserver threshold (0–1). Lower = fires sooner */
  threshold?: number
  /** HTML tag to render. Defaults to div. */
  as?: ElementType
}

const variantClass: Record<Variant, string> = {
  up:    '',
  left:  'from-left',
  right: 'from-right',
  zoom:  'zoom-up',
}

/**
 * Scroll-reveal wrapper.
 * Starts invisible and transitions in the moment it enters the viewport.
 * Uses IntersectionObserver — fires once, then disconnects.
 */
export default function AnimateIn({
  children,
  className = '',
  variant = 'up',
  delay = 0,
  threshold = 0.1,
  as: Tag = 'div',
}: AnimateInProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If already in view on mount (e.g. hero), trigger immediately
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal ${variantClass[variant]} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
