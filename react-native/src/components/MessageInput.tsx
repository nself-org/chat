/**
 * MessageInput - Message composition input with actions
 */

import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
  Platform,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { MAX_MESSAGE_LENGTH } from '@shared/constants'

import type { Message } from '@shared/types'

interface MessageInputProps {
  onSend: (content: string, attachments?: string[]) => void
  replyTo?: Message | null
  onCancelReply?: () => void
  placeholder?: string
  showMentions?: boolean
  disabled?: boolean
}

export function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  placeholder = 'Message...',
  showMentions = false,
  disabled = false,
}: MessageInputProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)

  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)

  const recordingAnimation = useRef(new Animated.Value(0)).current

  const canSend = message.trim().length > 0

  const handleSend = useCallback(() => {
    if (!canSend || disabled) return

    const content = message.trim()
    onSend(content)
    setMessage('')
    Keyboard.dismiss()
  }, [canSend, disabled, message, onSend])

  const handleAttachmentPress = useCallback(() => {
    setShowAttachments(!showAttachments)
    // Would typically open action sheet with options:
    // - Photo Library
    // - Camera
    // - Document
    // - Location
    // - Contact
  }, [showAttachments])

  const handleCameraPress = useCallback(() => {
    // Open camera directly
  }, [])

  const handleVoiceStart = useCallback(() => {
    setIsRecording(true)
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start()
    // Start voice recording
  }, [recordingAnimation])

  const handleVoiceEnd = useCallback(() => {
    setIsRecording(false)
    recordingAnimation.stopAnimation()
    // Stop recording and send
  }, [recordingAnimation])

  const handleEmojiPress = useCallback(() => {
    // Open emoji picker
  }, [])

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: insets.bottom || 8,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {/* Reply Preview */}
      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.replyBar, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.replyContent}>
            <Text style={[styles.replyLabel, { color: theme.colors.primary }]}>
              Replying to {replyTo.senderId}
            </Text>
            <Text
              style={[styles.replyText, { color: theme.colors.muted }]}
              numberOfLines={1}
            >
              {replyTo.content}
            </Text>
          </View>
          <Pressable style={styles.replyClose} onPress={onCancelReply}>
            <Text style={{ color: theme.colors.muted }}>X</Text>
          </Pressable>
        </View>
      )}

      {/* Attachment Options */}
      {showAttachments && (
        <View style={[styles.attachmentOptions, { backgroundColor: theme.colors.surface }]}>
          <Pressable style={styles.attachmentOption}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: '#FFFFFF' }}>image</Text>
            </View>
            <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>
              Photo
            </Text>
          </Pressable>
          <Pressable style={styles.attachmentOption}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.secondary }]}>
              <Text style={{ color: '#FFFFFF' }}>video</Text>
            </View>
            <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>
              Video
            </Text>
          </Pressable>
          <Pressable style={styles.attachmentOption}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.accent }]}>
              <Text style={{ color: '#FFFFFF' }}>file</Text>
            </View>
            <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>
              File
            </Text>
          </Pressable>
          <Pressable style={styles.attachmentOption}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.success }]}>
              <Text style={{ color: '#FFFFFF' }}>location</Text>
            </View>
            <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>
              Location
            </Text>
          </Pressable>
        </View>
      )}

      {/* Main Input Row */}
      <View style={styles.inputRow}>
        {/* Attachment Button */}
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleAttachmentPress}
        >
          <Text style={{ color: theme.colors.muted }}>+</Text>
        </Pressable>

        {/* Input Container */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBackground }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.placeholder}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            editable={!disabled && !isRecording}
            returnKeyType="default"
          />

          {/* Emoji Button */}
          <Pressable style={styles.emojiButton} onPress={handleEmojiPress}>
            <Text style={{ color: theme.colors.muted }}>emoji</Text>
          </Pressable>
        </View>

        {/* Send / Voice Button */}
        {canSend ? (
          <Pressable
            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSend}
            disabled={disabled}
          >
            <Text style={{ color: theme.colors.buttonPrimaryText }}>send</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.voiceButton,
              {
                backgroundColor: isRecording ? theme.colors.error : theme.colors.surface,
              },
            ]}
            onPressIn={handleVoiceStart}
            onPressOut={handleVoiceEnd}
            disabled={disabled}
          >
            <Animated.View
              style={{
                opacity: isRecording
                  ? recordingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    })
                  : 1,
              }}
            >
              <Text style={{ color: isRecording ? '#FFFFFF' : theme.colors.muted }}>
                mic
              </Text>
            </Animated.View>
          </Pressable>
        )}
      </View>

      {/* Character Count (when close to limit) */}
      {message.length > MAX_MESSAGE_LENGTH * 0.8 && (
        <View style={styles.characterCount}>
          <Text
            style={[
              styles.characterCountText,
              {
                color:
                  message.length > MAX_MESSAGE_LENGTH * 0.95
                    ? theme.colors.error
                    : theme.colors.muted,
              },
            ]}
          >
            {message.length}/{MAX_MESSAGE_LENGTH}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  replyBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  replyContent: {
    flex: 1,
    padding: 8,
  },
  replyLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 13,
    marginTop: 2,
  },
  replyClose: {
    padding: 12,
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
  },
  attachmentOption: {
    alignItems: 'center',
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 0,
    paddingBottom: 0,
    ...Platform.select({
      android: {
        textAlignVertical: 'center',
      },
    }),
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterCount: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  characterCountText: {
    fontSize: 11,
  },
})

export default MessageInput
