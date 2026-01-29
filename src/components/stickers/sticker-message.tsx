'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play, Pause, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StickerService } from '@/lib/stickers/sticker-service'
import type { Sticker, StickerPack } from '@/graphql/stickers'

// ============================================================================
// TYPES
// ============================================================================

export interface StickerMessageProps {
  sticker: Sticker
  onClick?: (sticker: Sticker) => void
  onPackClick?: (packId: string) => void
  size?: 'sm' | 'md' | 'lg'
  showPackInfo?: boolean
  packInfo?: Pick<StickerPack, 'id' | 'name' | 'thumbnail_url'>
  className?: string
}

export interface StickerMessageBubbleProps extends StickerMessageProps {
  isOwn?: boolean
  timestamp?: string | Date
  senderName?: string
  showSender?: boolean
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const sizeConfig = {
  sm: {
    container: 'max-w-[120px]',
    image: 112,
    packIcon: 'h-3 w-3',
    packText: 'text-[10px]',
  },
  md: {
    container: 'max-w-[180px]',
    image: 168,
    packIcon: 'h-4 w-4',
    packText: 'text-xs',
  },
  lg: {
    container: 'max-w-[240px]',
    image: 224,
    packIcon: 'h-4 w-4',
    packText: 'text-xs',
  },
}

// ============================================================================
// LOTTIE PLAYER (for animated stickers in messages)
// ============================================================================

interface MessageLottiePlayerProps {
  src: string
  size: number
  autoplay?: boolean
  loop?: boolean
  className?: string
}

function MessageLottiePlayer({
  src,
  size,
  autoplay = true,
  loop = true,
  className,
}: MessageLottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<unknown>(null)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true

    import('lottie-web').then((lottie) => {
      if (!containerRef.current || !isMounted) return

      // Clear any existing animation
      if (animationRef.current) {
        (animationRef.current as { destroy: () => void }).destroy()
      }

      try {
        animationRef.current = lottie.default.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay: isPlaying,
          path: src,
        })

        const anim = animationRef.current as {
          addEventListener: (event: string, cb: () => void) => void
        }

        anim.addEventListener('DOMLoaded', () => {
          if (isMounted) {
            setLoaded(true)
          }
        })
      } catch (err) {
        console.error('Failed to load Lottie animation:', err)
        if (isMounted) {
          setError(true)
        }
      }
    }).catch((err) => {
      console.error('Failed to import lottie-web:', err)
      if (isMounted) {
        setError(true)
      }
    })

    return () => {
      isMounted = false
      if (animationRef.current) {
        (animationRef.current as { destroy: () => void }).destroy()
      }
    }
  }, [src, loop, isPlaying])

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

  if (error) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted rounded-lg', className)}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground">Error loading</span>
      </div>
    )
  }

  return (
    <div className={cn('relative group', className)} style={{ width: size, height: size }}>
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg animate-pulse">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      {loaded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="absolute bottom-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
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
// STICKER MESSAGE COMPONENT
// ============================================================================

export function StickerMessage({
  sticker,
  onClick,
  onPackClick,
  size = 'md',
  showPackInfo = false,
  packInfo,
  className,
}: StickerMessageProps) {
  const [imageError, setImageError] = useState(false)
  const config = sizeConfig[size]

  const isAnimated = StickerService.isAnimatedSticker(sticker)
  const stickerType = StickerService.getStickerType(sticker)

  const handleClick = useCallback(() => {
    onClick?.(sticker)
  }, [onClick, sticker])

  const handlePackClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onPackClick?.(sticker.pack_id)
  }, [onPackClick, sticker.pack_id])

  return (
    <div
      className={cn(
        'inline-block',
        config.container,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick()
              }
            }
          : undefined
      }
    >
      {/* Sticker Image/Animation */}
      <div className="relative">
        {isAnimated && stickerType === 'lottie' ? (
          <MessageLottiePlayer
            src={sticker.url}
            size={config.image}
            className="rounded-lg"
          />
        ) : imageError ? (
          <div
            className="flex items-center justify-center bg-muted rounded-lg"
            style={{ width: config.image, height: config.image }}
          >
            <span className="text-xs text-muted-foreground">Failed to load</span>
          </div>
        ) : (
          <Image
            src={sticker.url}
            alt={sticker.name || 'Sticker'}
            width={config.image}
            height={config.image}
            className="object-contain"
            onError={() => setImageError(true)}
            unoptimized={stickerType === 'gif'}
            priority
          />
        )}
      </div>

      {/* Pack Info */}
      {showPackInfo && packInfo && (
        <button
          type="button"
          onClick={handlePackClick}
          className={cn(
            'flex items-center gap-1 mt-1 px-2 py-1 rounded-md',
            'text-muted-foreground hover:text-foreground hover:bg-accent',
            'transition-colors',
            config.packText
          )}
        >
          {packInfo.thumbnail_url ? (
            <Image
              src={packInfo.thumbnail_url}
              alt={packInfo.name}
              width={16}
              height={16}
              className="rounded object-cover"
            />
          ) : (
            <Package className={config.packIcon} />
          )}
          <span className="truncate">{packInfo.name}</span>
        </button>
      )}
    </div>
  )
}

// ============================================================================
// STICKER MESSAGE BUBBLE (styled like a chat bubble)
// ============================================================================

export function StickerMessageBubble({
  sticker,
  onClick,
  onPackClick,
  size = 'md',
  showPackInfo = false,
  packInfo,
  isOwn = false,
  timestamp,
  senderName,
  showSender = true,
  className,
}: StickerMessageBubbleProps) {
  const formattedTime = timestamp
    ? typeof timestamp === 'string'
      ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isOwn && 'items-end',
        className
      )}
    >
      {/* Sender Name */}
      {showSender && senderName && !isOwn && (
        <span className="text-xs font-medium text-foreground/80 ml-1">
          {senderName}
        </span>
      )}

      {/* Sticker */}
      <div
        className={cn(
          'relative p-2 rounded-2xl',
          isOwn ? 'bg-primary/5' : 'bg-muted/50'
        )}
      >
        <StickerMessage
          sticker={sticker}
          onClick={onClick}
          onPackClick={onPackClick}
          size={size}
          showPackInfo={showPackInfo}
          packInfo={packInfo}
        />
      </div>

      {/* Timestamp */}
      {formattedTime && (
        <span
          className={cn(
            'text-[10px] text-muted-foreground',
            isOwn ? 'mr-1' : 'ml-1'
          )}
        >
          {formattedTime}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// STICKER MESSAGE PREVIEW (for message input preview)
// ============================================================================

export interface StickerMessagePreviewProps {
  sticker: Sticker
  onRemove?: () => void
  className?: string
}

export function StickerMessagePreview({
  sticker,
  onRemove,
  className,
}: StickerMessagePreviewProps) {
  const [imageError, setImageError] = useState(false)
  const stickerType = StickerService.getStickerType(sticker)

  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-2 p-2 rounded-lg bg-muted/50 border',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">Error</span>
          </div>
        ) : (
          <Image
            src={sticker.thumbnail_url || sticker.url}
            alt={sticker.name || 'Sticker'}
            fill
            className="object-contain"
            onError={() => setImageError(true)}
            unoptimized={stickerType === 'gif'}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {sticker.name || 'Sticker'}
        </p>
        <p className="text-xs text-muted-foreground">
          {sticker.width}x{sticker.height}
        </p>
      </div>

      {/* Remove Button */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'p-1 rounded-full text-muted-foreground hover:text-foreground',
            'hover:bg-background transition-colors'
          )}
          aria-label="Remove sticker"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ============================================================================
// STICKER MESSAGE SKELETON
// ============================================================================

export function StickerMessageSkeleton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const config = sizeConfig[size]

  return (
    <div className={cn('inline-block', config.container, className)}>
      <div
        className="rounded-lg bg-muted animate-pulse"
        style={{ width: config.image, height: config.image }}
      />
    </div>
  )
}

export default StickerMessage
