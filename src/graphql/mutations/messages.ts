import { gql } from '@apollo/client'

export const SEND_MESSAGE = gql`
  mutation SendMessage(
    $channelId: uuid!
    $content: String!
    $userId: uuid!
    $type: String = "text"
  ) {
    insert_nchat_messages_one(
      object: {
        channel_id: $channelId
        content: $content
        user_id: $userId
        type: $type
      }
    ) {
      id
      content
      type
      created_at
      user {
        id
        username
        display_name
        avatar_url
      }
    }
  }
`

export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($id: uuid!, $content: String!) {
    update_nchat_messages_by_pk(
      pk_columns: { id: $id }
      _set: { 
        content: $content
        is_edited: true
        edited_at: "now()"
      }
    ) {
      id
      content
      is_edited
      edited_at
    }
  }
`

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: uuid!) {
    update_nchat_messages_by_pk(
      pk_columns: { id: $id }
      _set: { 
        is_deleted: true
        deleted_at: "now()"
      }
    ) {
      id
      is_deleted
      deleted_at
    }
  }
`

export const ADD_REACTION = gql`
  mutation AddReaction($messageId: uuid!, $userId: uuid!, $emoji: String!) {
    insert_nchat_reactions_one(
      object: {
        message_id: $messageId
        user_id: $userId
        emoji: $emoji
      }
      on_conflict: {
        constraint: nchat_reactions_message_id_user_id_emoji_key
        update_columns: []
      }
    ) {
      id
      emoji
      created_at
    }
  }
`

export const REMOVE_REACTION = gql`
  mutation RemoveReaction($messageId: uuid!, $userId: uuid!, $emoji: String!) {
    delete_nchat_reactions(
      where: {
        message_id: { _eq: $messageId }
        user_id: { _eq: $userId }
        emoji: { _eq: $emoji }
      }
    ) {
      affected_rows
    }
  }
`