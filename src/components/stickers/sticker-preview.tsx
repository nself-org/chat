'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Heart, Plus, Info, Play, Pause } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { StickerService } from '@/lib/stickers/sticker-service'
import type { Sticker } from '@/graphql/stickers'

// ============================================================================
// TYPES
// ============================================================================

export interface StickerPreviewProps {
  sticker: Sticker
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: (sticker: Sticker) => void
  onLongPress?: (sticker: Sticker) => void
  onFavorite?: (sticker: Sticker) => void
  onInfo?: (sticker: Sticker) => void
  isFavorite?: boolean
  showHoverActions?: boolean
  showAnimation?: boolean
  className?: string
  disabled?: boolean
}

export interface LottiePlayerProps {
  src: string
  className?: string
  autoplay?: boolean
  loop?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const sizeConfig = {
  sm: {
    container: 'w-16 h-16',
    image: 56,
    iconSize: 'h-3 w-3',
    actionBtn: 'p-0.5',
  },
  md: {
    container: 'w-20 h-20',
    image: 72,
    iconSize: 'h-4 w-4',
    actionBtn: 'p-1',
  },
  lg: {
    container: 'w-24 h-24',
    image: 88,
    iconSize: 'h-4 w-4',
    actionBtn: 'p-1',
  },
  xl: {
    container: 'w-32 h-32',
    image: 120,
    iconSize: 'h-5 w-5',
    actionBtn: 'p-1.5',
  },
}

// ============================================================================
// LOTTIE PLAYER COMPONENT
// ============================================================================

function LottiePlayer({
  src,
  className,
  autoplay = true,
  loop = true,
  onLoad,
  onError,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<unknown>(null)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Dynamically import lottie-web to avoid SSR issues
    import('lottie-web').then((lottie) => {
      if (!containerRef.current) return

      // Clear any existing animation
      if (animationRef.current) {
        (animationRef.current as { destroy: () => void }).destroy()
      }

      try {
        animationRef.current = lottie.default.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay: autoplay && isPlaying,
          path: src,
        })

        const anim = animationRef.current as {
          addEventListener: (event: string, cb: () => void) => void
        }

        anim.addEventListener('DOMLoaded', () => {
          setLoaded(true)
          onLoad?.()
        })
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error('Failed to load animation'))
      }
    }).catch((err) => {
      onError?.(err instanceof Error ? err : new Error('Failed to import lottie-web'))
    })

    return () => {
      if (animationRef.current) {
        (animationRef.current as { destroy: () => void }).destroy()
      }
    }
  }, [src, loop, autoplay, isPlaying, onLoad, onError])

  const togglePlay = useCallback(() => {
    if (!animationRef.current) return

    const anim = animationRef.current as {
      play: () => void
      pause: () => void
    }

    if (isPlaying) {
      anim.pause()
    } else {
      anim.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  return (
    <div className={cn('relative', className)}>
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      {loaded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="absolute bottom-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  )
}

// ============================================================================
// STICKER PREVIEW COMPONENT
// ============================================================================

export function StickerPreview({
  sticker,
  size = 'md',
  onClick,
  onLongPress,
  onFavorite,
  onInfo,
  isFavorite = false,
  showHoverActions = true,
  showAnimation = true,
  className,
  disabled = false,
}: StickerPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const config = sizeConfig[size]

  const isAnimated = showAnimation && StickerService.isAnimatedSticker(sticker)
  const stickerType = StickerService.getStickerType(sticker)
  const thumbnailUrl = StickerService.getThumbnailUrl(sticker)

  // Handle click
  const handleClick = useCallback(() => {
    if (disabled) return
    onClick?.(sticker)
  }, [disabled, onClick, sticker])

  // Handle long press start
  const handleMouseDown = useCallback(() => {
    if (disabled || !onLongPress) return

    longPressTimerRef.current = setTimeout(() => {
      onLongPress(sticker)
    }, 500)
  }, [disabled, onLongPress, sticker])

  // Handle long press end
  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Handle touch events for mobile
  const handleTouchStart = useCallback(() => {
    if (disabled || !onLongPress) return

    longPressTimerRef.current = setTimeout(() => {
      onLongPress(sticker)
    }, 500)
  }, [disabled, onLongPress, sticker])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Handle favorite toggle
  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onFavorite?.(sticker)
  }, [onFavorite, sticker])

  // Handle info click
  const handleInfo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onInfo?.(sticker)
  }, [onInfo, sticker])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'group relative rounded-lg cursor-pointer transition-all',
        'hover:bg-accent/50 hover:scale-105',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        config.container,
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
        className
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsHovered(false)
        handleMouseUp()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={sticker.name || 'Sticker'}
    >
      {/* Sticker Image/Animation */}
      <div className="w-full h-full flex items-center justify-center p-1">
        {isAnimated && stickerType === 'lottie' && isHovered ? (
          <LottiePlayer
            src={sticker.url}
            className="w-full h-full"
          />
        ) : imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
            <span className="text-xs text-muted-foreground">Error</span>
          </div>
        ) : (
          <Image
            src={thumbnailUrl}
            alt={sticker.name || 'Sticker'}
            width={config.image}
            height={config.image}
            className={cn(
              'object-contain transition-transform',
              isAnimated && 'animate-pulse'
            )}
            onError={() => setImageError(true)}
            unoptimized={stickerType === 'gif'}
          />
        )}
      </div>

      {/* Animated indicator */}
      {isAnimated && !isHovered && (
        <div className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/50">
          <Play className="h-2.5 w-2.5 text-white" />
        </div>
      )}

      {/* Hover Actions */}
      {showHoverActions && isHovered && !disabled && (
        <div className="absolute top-0 right-0 flex gap-0.5 p-0.5 rounded-bl-lg bg-background/80 backdrop-blur-sm">
          {onFavorite && (
            <button
              type="button"
              onClick={handleFavorite}
              className={cn(
                'rounded transition-colors',
                config.actionBtn,
                isFavorite
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={cn(config.iconSize, isFavorite && 'fill-current')}
              />
            </button>
          )}
          {onInfo && (
            <button
              type="button"
              onClick={handleInfo}
              className={cn(
                'rounded text-muted-foreground hover:text-foreground transition-colors',
                config.actionBtn
              )}
              title="Sticker info"
            >
              <Info className={config.iconSize} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STICKER PREVIEW SKELETON
// ============================================================================

export function StickerPreviewSkeleton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'rounded-lg bg-muted animate-pulse',
        config.container,
        className
      )}
    />
  )
}

// ============================================================================
// STICKER PREVIEW LARGE (for full preview modal)
// ============================================================================

export interface StickerPreviewLargeProps {
  sticker: Sticker
  onClose?: () => void
  onSend?: (sticker: Sticker) => void
  onFavorite?: (sticker: Sticker) => void
  onViewPack?: (packId: string) => void
  isFavorite?: boolean
  className?: string
}

export function StickerPreviewLarge({
  sticker,
  onClose,
  onSend,
  onFavorite,
  onViewPack,
  isFavorite = false,
  className,
}: StickerPreviewLargeProps) {
  const isAnimated = StickerService.isAnimatedSticker(sticker)
  const stickerType = StickerService.getStickerType(sticker)

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 p-6 rounded-xl bg-background border shadow-lg',
        className
      )}
    >
      {/* Sticker Preview */}
      <div className="w-48 h-48 flex items-center justify-center">
        {isAnimated && stickerType === 'lottie' ? (
          <LottiePlayer src={sticker.url} className="w-full h-full" />
        ) : (
          <Image
            src={sticker.url}
            alt={sticker.name || 'Sticker'}
            width={192}
            height={192}
            className="object-contain"
            unoptimized={stickerType === 'gif'}
          />
        )}
      </div>

      {/* Sticker Info */}
      <div className="text-center">
        {sticker.name && (
          <h3 className="font-medium text-foreground">{sticker.name}</h3>
        )}
        {sticker.emoji && (
          <p className="text-sm text-muted-foreground">Emoji: {sticker.emoji}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {sticker.width}x{sticker.height}
          {sticker.file_size && ` - ${StickerService.formatFileSize(sticker.file_size)}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onSend && (
          <button
            type="button"
            onClick={() => onSend(sticker)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Send
          </button>
        )}
        {onFavorite && (
          <button
            type="button"
            onClick={() => onFavorite(sticker)}
            className={cn(
              'px-4 py-2 rounded-lg border transition-colors',
              isFavorite
                ? 'border-red-500 text-red-500 hover:bg-red-500/10'
                : 'border-input hover:bg-accent'
            )}
          >
            <Heart className={cn('h-4 w-4 mr-2 inline', isFavorite && 'fill-current')} />
            {isFavorite ? 'Favorited' : 'Favorite'}
          </button>
        )}
        {onViewPack && (
          <button
            type="button"
            onClick={() => onViewPack(sticker.pack_id)}
            className="px-4 py-2 rounded-lg border border-input hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            View Pack
          </button>
        )}
      </div>
    </div>
  )
}

export default StickerPreview
