/**
 * ChannelScreen - Group channel conversation view
 */

import React, { useCallback, useRef, useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { ChannelHeader } from '@components/ChannelHeader'
import { MessageBubble } from '@components/MessageBubble'
import { MessageInput } from '@components/MessageInput'
import { useMessages } from '@hooks/useMessages'
import { useChannel } from '@hooks/useChannel'
import { useAuth } from '@stores/auth-store'
import { formatDateHeader } from '@shared/utils'

import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'
import type { Message } from '@shared/types'

type ChannelRouteProp = RouteProp<RootStackParamList, 'Channel'>
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface MessageSection {
  type: 'message' | 'date'
  data: Message | string
  key: string
}

export function ChannelScreen() {
  const route = useRoute<ChannelRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const { channelId, title } = route.params
  const { channel } = useChannel(channelId)
  const { messages, isLoading, sendMessage, loadMore, markAsRead } = useMessages(channelId)

  const flatListRef = useRef<FlatList>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  // Mark messages as read when screen is focused
  useEffect(() => {
    markAsRead()
  }, [markAsRead])

  // Group messages by date
  const sectionsData: MessageSection[] = React.useMemo(() => {
    const sections: MessageSection[] = []
    let currentDate = ''

    // Messages are in reverse order (newest first for inverted list)
    messages.forEach((message) => {
      const messageDate = formatDateHeader(message.createdAt)
      if (messageDate !== currentDate) {
        currentDate = messageDate
        sections.push({
          type: 'date',
          data: messageDate,
          key: `date-${message.id}`,
        })
      }
      sections.push({
        type: 'message',
        data: message,
        key: message.id,
      })
    })

    return sections
  }, [messages])

  const handleSend = useCallback(async (content: string, attachments?: string[]) => {
    await sendMessage({
      content,
      attachments,
      replyTo: replyTo?.id,
    })
    setReplyTo(null)
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [sendMessage, replyTo])

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!isLoading) {
      loadMore()
    }
  }, [isLoading, loadMore])

  const handleChannelInfo = useCallback(() => {
    // Navigate to channel info/settings
  }, [])

  const getTypingText = () => {
    if (typingUsers.length === 0) return null
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`
    return `${typingUsers.length} people are typing...`
  }

  const renderItem = useCallback(({ item }: { item: MessageSection }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateHeader}>
          <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.dateLabel, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.dateText, { color: theme.colors.muted }]}>
              {item.data as string}
            </Text>
          </View>
          <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
        </View>
      )
    }

    const message = item.data as Message
    const isOwnMessage = message.senderId === user?.id
    const messageIndex = messages.findIndex((m) => m.id === message.id)
    const previousMessage = messages[messageIndex + 1]
    const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId

    return (
      <MessageBubble
        message={message}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        showSenderName={!isOwnMessage && showAvatar}
        onReply={() => handleReply(message)}
        onLongPress={() => {
          // Show message actions
        }}
      />
    )
  }, [user?.id, messages, handleReply, theme.colors])

  const keyExtractor = useCallback((item: MessageSection) => item.key, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ChannelHeader
        title={title}
        subtitle={getTypingText() || `${channel?.members.length || 0} members`}
        channelType={channel?.type}
        onBackPress={() => navigation.goBack()}
        onTitlePress={handleChannelInfo}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={sectionsData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted
          contentContainerStyle={styles.messageList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        <MessageInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          placeholder={`Message #${channel?.name || title}`}
          showMentions
        />
      </KeyboardAvoidingView>
    </View>
  )
}

// Import Text at the top level
import { Text } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateLabel: {
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
})

export default ChannelScreen
