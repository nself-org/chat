/**
 * Stream Viewer Component
 *
 * Full viewer interface for watching live streams with HLS playback,
 * quality selection, chat, and reactions.
 *
 * @module components/streaming/StreamViewer
 */

'use client'

import { useStreamViewer } from '@/hooks/use-stream-viewer'
import { useStreamChat } from '@/hooks/use-stream-chat'
import { useStreamReactions } from '@/hooks/use-stream-reactions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Users,
  MessageSquare,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import type { StreamQuality } from '@/lib/streaming'

// ============================================================================
// Types
// ============================================================================

interface StreamViewerProps {
  streamId: string
  onStreamEnded?: () => void
}

// ============================================================================
// Component
// ============================================================================

export function StreamViewer({ streamId, onStreamEnded }: StreamViewerProps) {
  // Hooks
  const {
    stream,
    isLoading,
    isPlaying,
    isPaused,
    isBuffering,
    currentQuality,
    availableLevels,
    viewerCount,
    latency,
    volume,
    isMuted,
    error,
    videoRef,
    play,
    pause,
    setQuality,
    setVolume,
    setMuted,
    goToLive,
  } = useStreamViewer({
    streamId,
    autoStart: true,
    lowLatencyMode: true,
    onStreamEnded,
  })

  const { messages, isSending, sendMessage } = useStreamChat({
    streamId,
  })

  const { recentReactions, sendReaction } = useStreamReactions({
    streamId,
  })

  // Local state
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(true)

  // Emoji reactions
  const quickEmojis = ['👍', '❤️', '😂', '🔥', '🎉', '👏']

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    try {
      await sendMessage(chatInput.trim())
      setChatInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleSendReaction = async (emoji: string) => {
    try {
      // Random position for variety
      const x = Math.random() * 80 + 10 // 10-90%
      await sendReaction(emoji, { x, y: 0 })
    } catch (error) {
      console.error('Failed to send reaction:', error)
    }
  }

  const handleQualityChange = (quality: string) => {
    setQuality(quality as StreamQuality)
  }

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading stream...</p>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // Error State
  // ==========================================================================

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive font-semibold mb-2">Stream Error</p>
        <p className="text-muted-foreground">{error}</p>
      </Card>
    )
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Video Player */}
      <div className="lg:col-span-3 space-y-4">
        {/* Video Container */}
        <Card className="overflow-hidden bg-black aspect-video relative">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
          />

          {/* Buffering Overlay */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Live Indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full font-semibold">
              <Radio className="w-4 h-4 animate-pulse" />
              LIVE
            </div>
            {latency > 10 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={goToLive}
                className="text-xs"
              >
                Behind by {Math.floor(latency)}s
              </Button>
            )}
          </div>

          {/* Viewer Count */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/75 text-white px-3 py-1 rounded-full">
            <Users className="w-4 h-4" />
            <span>{viewerCount}</span>
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={isPlaying ? pause : () => play()}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              size="icon"
              variant="secondary"
              onClick={() => setMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24"
            />

            <div className="ml-auto">
              <Select value={currentQuality} onValueChange={handleQualityChange}>
                <SelectTrigger className="w-32 bg-black/75 text-white border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  {availableLevels.map((level) => (
                    <SelectItem key={level.level} value={level.name}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reactions Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {recentReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="absolute animate-float-up text-4xl"
                style={{
                  left: `${reaction.positionX ?? 50}%`,
                  bottom: 0,
                  animation: 'float-up 3s ease-out forwards',
                }}
              >
                {reaction.emoji}
              </div>
            ))}
          </div>
        </Card>

        {/* Stream Info */}
        <Card className="p-4">
          <h2 className="text-xl font-bold">{stream?.title}</h2>
          {stream?.description && (
            <p className="text-muted-foreground mt-2">{stream.description}</p>
          )}
        </Card>

        {/* Quick Reactions */}
        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold mr-2">Quick Reactions:</span>
            {quickEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="outline"
                size="sm"
                onClick={() => handleSendReaction(emoji)}
                className="text-2xl h-12 w-12 p-0"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">Live Chat</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
              >
                Hide
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-sm ${msg.isPinned ? 'bg-primary/10 p-2 rounded' : ''}`}
                  >
                    <span className="font-semibold text-primary">
                      {msg.user?.displayName ?? 'Anonymous'}:
                    </span>{' '}
                    <span className={msg.isDeleted ? 'text-muted-foreground italic' : ''}>
                      {msg.isDeleted ? '[Message deleted]' : msg.content}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Send a message..."
                  maxLength={500}
                  disabled={isSending}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isSending || !chatInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {chatInput.length}/500
              </p>
            </div>
          </Card>
        </div>
      )}

      {!showChat && (
        <div className="lg:col-span-1">
          <Button
            variant="outline"
            onClick={() => setShowChat(true)}
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Show Chat
          </Button>
        </div>
      )}

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-400px) scale(1.5);
            opacity: 0;
          }
        }

        .animate-float-up {
          animation: float-up 3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
