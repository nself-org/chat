'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Minus, Check, Package, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StickerPack, Sticker } from '@/graphql/stickers'

// ============================================================================
// TYPES
// ============================================================================

export interface StickerPackProps {
  pack: StickerPack
  isInstalled?: boolean
  onClick?: (pack: StickerPack) => void
  onAdd?: (pack: StickerPack) => Promise<void>
  onRemove?: (pack: StickerPack) => Promise<void>
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  className?: string
}

export interface StickerPackPreviewProps {
  pack: StickerPack
  stickers: Sticker[]
  isInstalled?: boolean
  onAdd?: (pack: StickerPack) => Promise<void>
  onRemove?: (pack: StickerPack) => Promise<void>
  onStickerClick?: (sticker: Sticker) => void
  loading?: boolean
  className?: string
}

export interface StickerPackTabProps {
  pack: StickerPack
  isActive?: boolean
  onClick?: (pack: StickerPack) => void
  showCount?: boolean
  className?: string
}

// ============================================================================
// STICKER PACK COMPONENT
// ============================================================================

export function StickerPackItem({
  pack,
  isInstalled = false,
  onClick,
  onAdd,
  onRemove,
  variant = 'default',
  showActions = true,
  className,
}: StickerPackProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleAction = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isInstalled && onRemove) {
        await onRemove(pack)
      } else if (!isInstalled && onAdd) {
        await onAdd(pack)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isInstalled, isLoading, onAdd, onRemove, pack])

  const handleClick = useCallback(() => {
    onClick?.(pack)
  }, [onClick, pack])

  // Compact variant (for tabs/list)
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg cursor-pointer',
          'hover:bg-accent transition-colors',
          className
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <div className="relative w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={pack.thumbnail_url}
              alt={pack.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <span className="text-sm font-medium truncate">{pack.name}</span>
        {pack.is_official && (
          <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
        )}
      </div>
    )
  }

  // Detailed variant (for pack preview)
  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'flex items-start gap-4 p-4 rounded-xl border bg-card',
          onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
          className
        )}
        onClick={onClick ? handleClick : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={pack.thumbnail_url}
              alt={pack.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{pack.name}</h3>
            {pack.is_official && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Official
              </Badge>
            )}
            {pack.is_animated && (
              <Badge variant="outline" className="text-xs">
                Animated
              </Badge>
            )}
          </div>
          {pack.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {pack.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {pack.author && <span>by {pack.author}</span>}
            <span>{pack.sticker_count} stickers</span>
          </div>
        </div>

        {/* Action Button */}
        {showActions && (onAdd || onRemove) && (
          <Button
            variant={isInstalled ? 'outline' : 'default'}
            size="sm"
            onClick={handleAction}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInstalled ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  // Default variant (card style)
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square bg-muted">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        ) : (
          <Image
            src={pack.thumbnail_url}
            alt={pack.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {pack.is_official && (
            <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Official
            </Badge>
          )}
          {pack.is_animated && (
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
              Animated
            </Badge>
          )}
        </div>
        {/* Installed check */}
        {isInstalled && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{pack.name}</h3>
        <p className="text-xs text-muted-foreground">
          {pack.sticker_count} stickers
        </p>
      </div>

      {/* Action Button */}
      {showActions && (onAdd || onRemove) && (
        <div className="px-3 pb-3">
          <Button
            variant={isInstalled ? 'outline' : 'default'}
            size="sm"
            onClick={handleAction}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInstalled ? (
              <>
                <Minus className="h-4 w-4 mr-1" />
                Remove
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STICKER PACK TAB
// ============================================================================

export function StickerPackTab({
  pack,
  isActive = false,
  onClick,
  showCount = false,
  className,
}: StickerPackTabProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onClick?.(pack)}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-accent',
        className
      )}
      title={pack.name}
    >
      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-muted">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <Image
            src={pack.thumbnail_url}
            alt={pack.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      {showCount && (
        <span className="text-[10px] text-muted-foreground">
          {pack.sticker_count}
        </span>
      )}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  )
}

// ============================================================================
// STICKER PACK PREVIEW (full pack with stickers)
// ============================================================================

export function StickerPackPreview({
  pack,
  stickers,
  isInstalled = false,
  onAdd,
  onRemove,
  onStickerClick,
  loading = false,
  className,
}: StickerPackPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleAction = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isInstalled && onRemove) {
        await onRemove(pack)
      } else if (!isInstalled && onAdd) {
        await onAdd(pack)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isInstalled, isLoading, onAdd, onRemove, pack])

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={pack.thumbnail_url}
              alt={pack.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{pack.name}</h3>
            {pack.is_official && (
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </div>
          {pack.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
              {pack.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {pack.author && <span>by {pack.author}</span>}
            <span>{pack.sticker_count} stickers</span>
            {pack.is_animated && (
              <Badge variant="outline" className="text-xs">
                Animated
              </Badge>
            )}
          </div>
        </div>
        {(onAdd || onRemove) && (
          <Button
            variant={isInstalled ? 'outline' : 'default'}
            onClick={handleAction}
            disabled={isLoading || loading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInstalled ? (
              <>
                <Minus className="h-4 w-4 mr-2" />
                Remove
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Pack
              </>
            )}
          </Button>
        )}
      </div>

      {/* Stickers Preview */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No stickers in this pack
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {stickers.slice(0, 15).map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => onStickerClick?.(sticker)}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden bg-muted',
                  'hover:bg-accent transition-colors',
                  onStickerClick && 'cursor-pointer'
                )}
              >
                <Image
                  src={sticker.thumbnail_url || sticker.url}
                  alt={sticker.name || 'Sticker'}
                  fill
                  className="object-contain p-1"
                />
              </button>
            ))}
            {stickers.length > 15 && (
              <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                +{stickers.length - 15}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STICKER PACK SKELETON
// ============================================================================

export function StickerPackSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'compact' | 'detailed'
}) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 p-2">
        <div className="w-8 h-8 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className="flex items-start gap-4 p-4 rounded-xl border bg-card">
        <div className="w-20 h-20 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="w-16 h-8 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}

export default StickerPackItem
