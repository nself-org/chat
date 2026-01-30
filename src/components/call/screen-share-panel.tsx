/**
 * Screen Share Panel Component
 *
 * Displays screen share streams with annotation and recording controls.
 * Supports cursor tracking, drawing tools, and quality adjustments.
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Monitor,
  MonitorOff,
  Circle,
  Square,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Settings,
  Download,
  Pause,
  Play,
  StopCircle,
} from 'lucide-react'
import { useScreenShare } from '@/hooks/use-screen-share'
import { useScreenRecording } from '@/hooks/use-screen-recording'
import type { ScreenShare } from '@/lib/webrtc/screen-capture'
import type { AnnotationTool } from '@/lib/webrtc/screen-annotator'

// =============================================================================
// Types
// =============================================================================

export interface ScreenSharePanelProps {
  userId: string
  userName: string
  onStreamStarted?: (stream: MediaStream) => void
  onStreamEnded?: () => void
  showAnnotations?: boolean
  showRecording?: boolean
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function ScreenSharePanel({
  userId,
  userName,
  onStreamStarted,
  onStreamEnded,
  showAnnotations = true,
  showRecording = true,
  className,
}: ScreenSharePanelProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Hooks
  const {
    isScreenSharing,
    screenStream,
    startScreenShare,
    stopScreenShare,
    updateQuality,
    supportsSystemAudio: hasSystemAudioSupport,
  } = useScreenShare({
    userId,
    userName,
    onScreenShareStarted: (stream) => {
      onStreamStarted?.(stream)
    },
    onScreenShareStopped: () => {
      onStreamEnded?.()
    },
    useAdvancedCapture: true,
  })

  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formatDuration,
  } = useScreenRecording()

  // State
  const [selectedTool, setSelectedTool] = React.useState<AnnotationTool>('pen')
  const [showToolbar, setShowToolbar] = React.useState(false)
  const [quality, setQuality] = React.useState<'auto' | '720p' | '1080p' | '4k'>('1080p')

  // Display screen stream
  React.useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream
    }
  }, [screenStream])

  // Handle start screen share
  const handleStartScreenShare = async () => {
    try {
      await startScreenShare({
        quality,
        captureSystemAudio: hasSystemAudioSupport,
        captureCursor: true,
        frameRate: 30,
      })
    } catch (error) {
      console.error('Failed to start screen share:', error)
    }
  }

  // Handle stop screen share
  const handleStopScreenShare = () => {
    if (isRecording) {
      handleStopRecording()
    }
    stopScreenShare()
  }

  // Handle start recording
  const handleStartRecording = async () => {
    if (!screenStream) return

    try {
      await startRecording(screenStream, {
        quality: 'high',
        format: 'webm',
      })
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      const recording = await stopRecording()
      if (recording) {
        // Recording stopped successfully
      }
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }
  }

  // Handle quality change
  const handleQualityChange = async (newQuality: typeof quality) => {
    setQuality(newQuality)
    if (isScreenSharing) {
      try {
        await updateQuality(newQuality)
      } catch (error) {
        console.error('Failed to update quality:', error)
      }
    }
  }

  return (
    <div className={cn('relative w-full h-full bg-gray-900 rounded-lg overflow-hidden', className)}>
      {/* Video Display */}
      <div className="relative w-full h-full">
        {isScreenSharing && screenStream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            {/* Annotation Canvas Overlay */}
            {showAnnotations && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No screen share active</p>
              <p className="text-sm mt-2">Click the button below to start sharing</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg p-2">
        {/* Screen Share Toggle */}
        {!isScreenSharing ? (
          <Button
            onClick={handleStartScreenShare}
            size="sm"
            variant="default"
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            Start Sharing
          </Button>
        ) : (
          <Button
            onClick={handleStopScreenShare}
            size="sm"
            variant="destructive"
            className="gap-2"
          >
            <MonitorOff className="h-4 w-4" />
            Stop Sharing
          </Button>
        )}

        {/* Annotation Tools Toggle */}
        {isScreenSharing && showAnnotations && (
          <Button
            onClick={() => setShowToolbar(!showToolbar)}
            size="sm"
            variant={showToolbar ? 'secondary' : 'ghost'}
            className="gap-2"
          >
            <Circle className="h-4 w-4" />
            Annotate
          </Button>
        )}

        {/* Recording Controls */}
        {isScreenSharing && showRecording && (
          <>
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                size="sm"
                variant="ghost"
                className="gap-2"
              >
                <Circle className="h-4 w-4 text-red-500" />
                Record
              </Button>
            ) : (
              <>
                <Button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={handleStopRecording}
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono text-white px-2">
                  {formatDuration(duration)}
                </span>
              </>
            )}
          </>
        )}

        {/* Quality Selector */}
        {isScreenSharing && (
          <select
            value={quality}
            onChange={(e) => handleQualityChange(e.target.value as typeof quality)}
            className="text-sm bg-white/10 text-white border-none rounded px-2 py-1"
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4k">4K</option>
          </select>
        )}
      </div>

      {/* Annotation Toolbar */}
      {showToolbar && isScreenSharing && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-black/70 backdrop-blur-sm rounded-lg p-2">
          <Button
            onClick={() => setSelectedTool('pen')}
            size="icon"
            variant={selectedTool === 'pen' ? 'secondary' : 'ghost'}
            className="h-8 w-8"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setSelectedTool('arrow')}
            size="icon"
            variant={selectedTool === 'arrow' ? 'secondary' : 'ghost'}
            className="h-8 w-8"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setSelectedTool('text')}
            size="icon"
            variant={selectedTool === 'text' ? 'secondary' : 'ghost'}
            className="h-8 w-8"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setSelectedTool('eraser')}
            size="icon"
            variant={selectedTool === 'eraser' ? 'secondary' : 'ghost'}
            className="h-8 w-8"
          >
            <Eraser className="h-4 w-4" />
          </Button>
          <div className="h-px bg-white/20 my-1" />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white rounded-full px-3 py-1.5 text-sm font-medium">
          <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
          REC
        </div>
      )}
    </div>
  )
}
