/**
 * ChatScreen - Direct message conversation view
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
import { useAuth } from '@stores/auth-store'

import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'
import type { Message } from '@shared/types'

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function ChatScreen() {
  const route = useRoute<ChatRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const { channelId, title } = route.params
  const { messages, isLoading, sendMessage, loadMore, markAsRead } = useMessages(channelId)

  const flatListRef = useRef<FlatList>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  // Mark messages as read when screen is focused
  useEffect(() => {
    markAsRead()
  }, [markAsRead])

  const handleSend = useCallback(async (content: string, attachments?: string[]) => {
    await sendMessage({
      content,
      attachments,
      replyTo: replyTo?.id,
    })
    setReplyTo(null)

    // Scroll to bottom after sending
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

  const handleProfilePress = useCallback(() => {
    navigation.navigate('Profile', { userId: channelId })
  }, [navigation, channelId])

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id
    const previousMessage = messages[index + 1]
    const showAvatar = !previousMessage || previousMessage.senderId !== item.senderId

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        onReply={() => handleReply(item)}
        onLongPress={() => {
          // Show message actions
        }}
      />
    )
  }, [user?.id, messages, handleReply])

  const keyExtractor = useCallback((item: Message) => item.id, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ChannelHeader
        title={title}
        subtitle={isTyping ? 'typing...' : 'Online'}
        onBackPress={() => navigation.goBack()}
        onTitlePress={handleProfilePress}
        showCallButton
        onCallPress={() => {
          // Initiate call
        }}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
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
          placeholder="Message..."
        />
      </KeyboardAvoidingView>
    </View>
  )
}

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
})

export default ChatScreen
