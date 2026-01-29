'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(e.target.value.length > 0)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0)
      props.onChange?.(e)
    }

    React.useEffect(() => {
      if (props.value) {
        setHasValue(String(props.value).length > 0)
      }
    }, [props.value])

    const isActive = isFocused || hasValue || props.value

    return (
      <div className="relative">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <div className={cn(
                "transition-colors",
                isFocused ? "text-[#00D4FF]" : "text-zinc-400 dark:text-zinc-500"
              )}>
                {icon}
              </div>
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              "peer w-full rounded-xl border bg-white dark:bg-zinc-900 px-3 py-3 text-sm text-zinc-900 dark:text-white transition-all duration-200 placeholder-transparent",
              // Default border - Protocol style
              "border-zinc-900/10 dark:border-white/10",
              // Focus states - nself blue
              "focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF]",
              // Error states
              error && "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20",
              // Icon padding
              icon && "pl-10",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder=" "
            {...props}
          />

          {label && (
            <label
              className={cn(
                "absolute left-3 top-3 text-sm transition-all duration-200 pointer-events-none",
                // Icon padding - different position when icon is present
                icon && "left-10",
                // Active/focused state - Protocol background
                isActive && "-top-2 left-2 bg-white dark:bg-zinc-900 px-1 text-xs",
                // Color states - nself blue when focused
                isFocused && !error ? "text-[#00D4FF]" : error ? "text-red-500" : "text-zinc-600 dark:text-zinc-400",
                // Peer selectors for floating effect
                "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-600 dark:peer-placeholder-shown:text-zinc-400",
                icon && "peer-placeholder-shown:left-10",
                "peer-focus:-top-2 peer-focus:left-2 peer-focus:bg-white dark:peer-focus:bg-zinc-900 peer-focus:px-1 peer-focus:text-xs peer-focus:text-[#00D4FF]"
              )}
            >
              {label}
            </label>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    )
  }
)

EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }