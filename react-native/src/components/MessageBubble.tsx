/**
 * MessageBubble - Individual message display
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from 'react-native'

import { useTheme } from '@theme'
import { UserAvatar } from './UserAvatar'
import { formatMessageTime, truncate } from '@shared/utils'

import type { Message, Attachment } from '@shared/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  showAvatar?: boolean
  showSenderName?: boolean
  onReply?: () => void
  onLongPress?: () => void
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  showSenderName = false,
  onReply,
  onLongPress,
}: MessageBubbleProps) {
  const { theme } = useTheme()

  const bubbleStyle = isOwnMessage
    ? {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
      }
    : {
        backgroundColor: theme.colors.surface,
        borderBottomLeftRadius: 4,
      }

  const textColor = isOwnMessage ? theme.colors.buttonPrimaryText : theme.colors.text

  const renderAttachment = (attachment: Attachment, index: number) => {
    switch (attachment.type) {
      case 'image':
        return (
          <Pressable
            key={attachment.id || index}
            onPress={() => {
              // Open image viewer
            }}
          >
            <Image
              source={{ uri: attachment.thumbnailUrl || attachment.url }}
              style={[
                styles.imageAttachment,
                {
                  width: Math.min(attachment.width || 200, MAX_BUBBLE_WIDTH - 24),
                  height: Math.min(attachment.height || 150, 300),
                },
              ]}
              resizeMode="cover"
            />
          </Pressable>
        )

      case 'video':
        return (
          <Pressable
            key={attachment.id || index}
            style={[styles.videoAttachment, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              // Open video player
            }}
          >
            <Image
              source={{ uri: attachment.thumbnailUrl }}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={[styles.playButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Text style={{ color: '#FFFFFF', fontSize: 24 }}>play</Text>
            </View>
          </Pressable>
        )

      case 'audio':
        return (
          <View
            key={attachment.id || index}
            style={[styles.audioAttachment, { backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.1)' : theme.colors.border }]}
          >
            <Pressable style={styles.audioPlayButton}>
              <Text style={{ color: textColor }}>play</Text>
            </Pressable>
            <View style={styles.audioWaveform}>
              {/* Waveform visualization */}
              <View style={[styles.waveformBar, { backgroundColor: textColor + '40' }]} />
              <View style={[styles.waveformBar, { backgroundColor: textColor + '40', height: 16 }]} />
              <View style={[styles.waveformBar, { backgroundColor: textColor + '40', height: 24 }]} />
              <View style={[styles.waveformBar, { backgroundColor: textColor + '40', height: 12 }]} />
              <View style={[styles.waveformBar, { backgroundColor: textColor + '40', height: 20 }]} />
            </View>
            {attachment.duration && (
              <Text style={[styles.audioDuration, { color: textColor }]}>
                {Math.floor(attachment.duration / 60)}:{(attachment.duration % 60).toString().padStart(2, '0')}
              </Text>
            )}
          </View>
        )

      case 'file':
        return (
          <Pressable
            key={attachment.id || index}
            style={[styles.fileAttachment, { backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.1)' : theme.colors.border }]}
            onPress={() => {
              // Download/open file
            }}
          >
            <View style={styles.fileIcon}>
              <Text style={{ color: textColor }}>file</Text>
            </View>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Text style={[styles.fileSize, { color: textColor + '80' }]}>
                {formatFileSize(attachment.size)}
              </Text>
            </View>
          </Pressable>
        )

      default:
        return null
    }
  }

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null

    return (
      <View style={[styles.reactionsContainer, { backgroundColor: theme.colors.background }]}>
        {message.reactions.map((reaction, index) => (
          <Pressable
            key={index}
            style={[styles.reaction, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
            <Text style={[styles.reactionCount, { color: theme.colors.text }]}>
              {reaction.count}
            </Text>
          </Pressable>
        ))}
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {/* Avatar (for other users) */}
      {!isOwnMessage && showAvatar && (
        <View style={styles.avatarContainer}>
          <UserAvatar size={32} />
        </View>
      )}
      {!isOwnMessage && !showAvatar && <View style={styles.avatarPlaceholder} />}

      <View style={styles.bubbleWrapper}>
        {/* Sender name (for channels) */}
        {showSenderName && !isOwnMessage && (
          <Text style={[styles.senderName, { color: theme.colors.primary }]}>
            {message.senderId}
          </Text>
        )}

        <Pressable
          style={[styles.bubble, bubbleStyle]}
          onLongPress={onLongPress}
        >
          {/* Reply preview */}
          {message.replyTo && (
            <View style={[styles.replyPreview, { borderLeftColor: theme.colors.primary }]}>
              <Text style={[styles.replyText, { color: textColor + '80' }]} numberOfLines={1}>
                Replying to a message
              </Text>
            </View>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map(renderAttachment)}
            </View>
          )}

          {/* Message content */}
          {message.content && (
            <Text style={[styles.messageText, { color: textColor }]}>
              {message.content}
            </Text>
          )}

          {/* Timestamp and status */}
          <View style={styles.meta}>
            <Text style={[styles.time, { color: textColor + '80' }]}>
              {formatMessageTime(message.createdAt)}
            </Text>
            {message.isEdited && (
              <Text style={[styles.edited, { color: textColor + '60' }]}>
                (edited)
              </Text>
            )}
            {isOwnMessage && (
              <Text style={[styles.status, { color: textColor + '80' }]}>
                {/* Read receipt indicator */}
                check
              </Text>
            )}
          </View>
        </Pressable>

        {/* Reactions */}
        {renderReactions()}
      </View>
    </View>
  )
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarPlaceholder: {
    width: 40,
  },
  bubbleWrapper: {
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    padding: 10,
    borderRadius: 16,
  },
  replyPreview: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginBottom: 6,
  },
  replyText: {
    fontSize: 13,
  },
  attachmentsContainer: {
    marginBottom: 6,
  },
  imageAttachment: {
    borderRadius: 12,
    marginBottom: 4,
  },
  videoAttachment: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 12,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
  },
  edited: {
    fontSize: 11,
    marginLeft: 4,
  },
  status: {
    fontSize: 11,
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginLeft: 8,
    gap: 4,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
  },
})

export default MessageBubble
