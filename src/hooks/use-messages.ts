import { useQuery, useMutation, useSubscription } from '@apollo/client'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION } from '@/graphql/queries/messages'
import { SEND_MESSAGE, UPDATE_MESSAGE, DELETE_MESSAGE, ADD_REACTION, REMOVE_REACTION } from '@/graphql/mutations/messages'

export function useMessages(channelId: string) {
  const { data, loading, error, fetchMore } = useQuery(GET_MESSAGES, {
    variables: { channelId, limit: 50 },
    skip: !channelId,
  })
  
  // Subscribe to new messages
  useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { channelId },
    skip: !channelId,
  })
  
  const loadMore = () => {
    if (!data?.nchat_messages) return
    
    return fetchMore({
      variables: {
        offset: data.nchat_messages.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev
        return {
          nchat_messages: [
            ...prev.nchat_messages,
            ...fetchMoreResult.nchat_messages,
          ],
        }
      },
    })
  }
  
  return {
    messages: data?.nchat_messages || [],
    loading,
    error,
    loadMore,
  }
}

export function useSendMessage() {
  const [sendMessage, { loading, error }] = useMutation(SEND_MESSAGE)
  
  return {
    sendMessage: async (channelId: string, content: string, userId: string) => {
      return sendMessage({
        variables: {
          channelId,
          content,
          userId,
        },
      })
    },
    loading,
    error,
  }
}

export function useUpdateMessage() {
  const [updateMessage, { loading, error }] = useMutation(UPDATE_MESSAGE)
  
  return {
    updateMessage,
    loading,
    error,
  }
}

export function useDeleteMessage() {
  const [deleteMessage, { loading, error }] = useMutation(DELETE_MESSAGE)
  
  return {
    deleteMessage,
    loading,
    error,
  }
}

export function useReactions() {
  const [addReaction] = useMutation(ADD_REACTION)
  const [removeReaction] = useMutation(REMOVE_REACTION)
  
  return {
    addReaction: async (messageId: string, userId: string, emoji: string) => {
      return addReaction({
        variables: { messageId, userId, emoji },
      })
    },
    removeReaction: async (messageId: string, userId: string, emoji: string) => {
      return removeReaction({
        variables: { messageId, userId, emoji },
      })
    },
  }
}