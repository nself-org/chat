'use client'

/**
 * LinkCard - Card layout for link previews
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { LinkImage } from './LinkImage'
import { LinkTitle } from './LinkTitle'
import { LinkDescription } from './LinkDescription'
import { LinkDomain } from './LinkDomain'
import type { LinkPreviewData } from '@/lib/link-preview'

export interface LinkCardProps {
  /** Preview data */
  data: LinkPreviewData
  /** Card layout variant */
  variant?: 'vertical' | 'horizontal' | 'compact'
  /** Show image */
  showImage?: boolean
  /** Show description */
  showDescription?: boolean
  /** Show favicon */
  showFavicon?: boolean
  /** Maximum image height */
  maxImageHeight?: number
  /** Click handler */
  onClick?: () => void
  /** Additional class name */
  className?: string
  /** Children (for action buttons, etc.) */
  children?: React.ReactNode
}

export function LinkCard({
  data,
  variant = 'vertical',
  showImage = true,
  showDescription = true,
  showFavicon = true,
  maxImageHeight = 200,
  onClick,
  className,
  children,
}: LinkCardProps) {
  const hasImage = showImage && data.image

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick()
    } else {
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e as unknown as React.MouseEvent)
    }
  }

  // Vertical layout (image on top)
  if (variant === 'vertical') {
    return (
      <div
        className={cn(
          'group relative rounded-lg border bg-card text-card-foreground shadow-sm',
          'hover:border-primary/50 hover:shadow-md transition-all duration-200',
          'cursor-pointer overflow-hidden',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="link"
        tabIndex={0}
        aria-label={data.title || data.url}
      >
        {hasImage && (
          <LinkImage
            src={data.image}
            alt={data.imageAlt || data.title}
            width={data.imageWidth}
            height={data.imageHeight}
            maxHeight={maxImageHeight}
            aspectRatio="16/9"
            className="rounded-t-lg rounded-b-none"
          />
        )}

        <div className="p-3 space-y-2">
          <LinkDomain
            domain={data.domain}
            favicon={data.favicon}
            siteName={data.siteName}
            isSecure={data.isSecure}
            showFavicon={showFavicon}
          />

          {data.title && (
            <LinkTitle title={data.title} maxLines={2} size="sm" />
          )}

          {showDescription && data.description && (
            <LinkDescription description={data.description} maxLines={2} size="sm" />
          )}
        </div>

        {children && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {children}
          </div>
        )}
      </div>
    )
  }

  // Horizontal layout (image on left)
  if (variant === 'horizontal') {
    return (
      <div
        className={cn(
          'group relative flex rounded-lg border bg-card text-card-foreground shadow-sm',
          'hover:border-primary/50 hover:shadow-md transition-all duration-200',
          'cursor-pointer overflow-hidden',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="link"
        tabIndex={0}
        aria-label={data.title || data.url}
      >
        {hasImage && (
          <div className="flex-shrink-0 w-32 sm:w-40">
            <LinkImage
              src={data.image}
              alt={data.imageAlt || data.title}
              width={data.imageWidth}
              height={data.imageHeight}
              aspectRatio="1/1"
              layout="cover"
              className="h-full rounded-l-lg rounded-r-none"
            />
          </div>
        )}

        <div className="flex-1 p-3 space-y-1.5 min-w-0">
          <LinkDomain
            domain={data.domain}
            favicon={data.favicon}
            siteName={data.siteName}
            isSecure={data.isSecure}
            showFavicon={showFavicon}
          />

          {data.title && (
            <LinkTitle title={data.title} maxLines={2} size="sm" />
          )}

          {showDescription && data.description && (
            <LinkDescription description={data.description} maxLines={2} size="sm" />
          )}
        </div>

        {children && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {children}
          </div>
        )}
      </div>
    )
  }

  // Compact layout (minimal)
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-2 rounded-lg border bg-card text-card-foreground',
        'hover:border-primary/50 hover:bg-accent/50 transition-all duration-200',
        'cursor-pointer overflow-hidden',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={data.title || data.url}
    >
      {hasImage ? (
        <div className="flex-shrink-0 w-12 h-12">
          <LinkImage
            src={data.image}
            alt={data.imageAlt || data.title}
            aspectRatio="1/1"
            layout="cover"
            className="w-full h-full rounded"
          />
        </div>
      ) : showFavicon && data.favicon ? (
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <img
            src={data.favicon}
            alt=""
            className="w-6 h-6 rounded"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        {data.title && (
          <LinkTitle title={data.title} maxLines={1} size="sm" />
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">
            {data.siteName || data.domain}
          </span>
        </div>
      </div>

      <svg
        className="w-4 h-4 text-muted-foreground flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>

      {children && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {children}
        </div>
      )}
    </div>
  )
}

export default LinkCard
