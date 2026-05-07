import * as React from 'react'
import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg' | number

const SIZE_MAP: Record<Exclude<SpinnerSize, number>, number> = {
  sm: 14,
  md: 18,
  lg: 24,
}

type SpinnerProps = Omit<React.ComponentProps<'svg'>, 'size'> & {
  size?: SpinnerSize
}

function Spinner({ className, size, ...props }: SpinnerProps) {
  const numericSize: number | undefined =
    typeof size === 'number'
      ? size
      : size
        ? SIZE_MAP[size]
        : undefined

  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      size={numericSize}
      className={cn(numericSize ? 'animate-spin' : 'size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
