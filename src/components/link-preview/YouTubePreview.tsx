'use client'

/**
 * YouTubePreview - YouTube video preview/embed
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { getYouTubeEmbedUrl } from '@/lib/link-preview'
import type { YouTubeVideoData } from '@/lib/link-preview'

export interface YouTubePreviewProps {
  /** YouTube video data */
  data: YouTubeVideoData
  /** Show embed player instead of thumbnail */
  showEmbed?: boolean
  /** Aspect ratio */
  aspectRatio?: '16/9' | '4/3'
  /** Additional class name */
  className?: string
  /** Children (for action buttons) */
  children?: React.ReactNode
}

export function YouTubePreview({
  data,
  showEmbed = false,
  aspectRatio = '16/9',
  className,
  children,
}: YouTubePreviewProps) {
  const [isPlaying, setIsPlaying] = React.useState(showEmbed)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleClick = () => {
    if (!isPlaying) {
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }

  const embedUrl = getYouTubeEmbedUrl(data.videoId)
  const thumbnailUrl = data.image || `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden',
        'hover:border-red-500/50 hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Video container */}
      <div
        className={cn(
          'relative bg-black',
          aspectRatio === '16/9' && 'aspect-video',
          aspectRatio === '4/3' && 'aspect-[4/3]'
        )}
      >
        {isPlaying ? (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={data.title || 'YouTube video'}
          />
        ) : (
          <>
            <img
              src={thumbnailUrl}
              alt={data.title || 'YouTube video thumbnail'}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            {/* Play button overlay */}
            <button
              type="button"
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              aria-label="Play video"
            >
              <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>

            {/* Duration badge */}
            {data.duration && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                {data.duration}
              </div>
            )}

            {/* Live badge */}
            {data.isLive && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded">
                LIVE
              </div>
            )}
          </>
        )}
      </div>

      {/* Video info */}
      <div
        className="p-3 cursor-pointer"
        onClick={handleClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* Title */}
        {data.title && (
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {data.title}
          </h3>
        )}

        {/* Channel info */}
        <div className="flex items-center gap-2 mt-2">
          {data.channelAvatar && (
            <img
              src={data.channelAvatar}
              alt={data.channelName}
              className="w-6 h-6 rounded-full"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            {data.channelName && (
              <p className="text-xs text-muted-foreground truncate">
                {data.channelName}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {data.viewCount !== undefined && (
            <span>{data.viewCount.toLocaleString()} views</span>
          )}
          {data.publishedAt && (
            <>
              <span className="text-muted-foreground/50">-</span>
              <span>{formatRelativeTime(data.publishedAt)}</span>
            </>
          )}
        </div>

        {/* Description */}
        {data.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}
      </div>

      {/* YouTube branding */}
      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded">
        <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
        <span className="text-white text-xs font-medium">YouTube</span>
      </div>

      {/* Children (remove button, etc.) */}
      {children && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {children}
        </div>
      )}
    </div>
  )
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'just now'
}

export default YouTubePreview
