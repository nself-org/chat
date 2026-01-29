/**
 * File Management GraphQL Operations
 *
 * Handles file uploads, downloads, and file management
 */

import { gql } from '@apollo/client'
import { ATTACHMENT_FRAGMENT, USER_BASIC_FRAGMENT, CHANNEL_BASIC_FRAGMENT } from './fragments'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FileType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'code'
  | 'other'

export type FileCategory =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'video/mp4'
  | 'video/webm'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'application/pdf'
  | 'application/msword'
  | 'application/zip'
  | 'text/plain'
  | 'text/csv'

export interface UploadFileVariables {
  fileName: string
  fileType: string
  fileSize: number
  channelId?: string
  messageId?: string
}

export interface CreateFileRecordVariables {
  messageId: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  thumbnailUrl?: string
  width?: number
  height?: number
  duration?: number
  metadata?: Record<string, unknown>
}

export interface DeleteFileVariables {
  id: string
}

export interface GetFilesVariables {
  channelId?: string
  userId?: string
  fileType?: string
  limit?: number
  offset?: number
}

export interface UpdateFileMetadataVariables {
  id: string
  metadata: Record<string, unknown>
}

export interface GenerateThumbnailVariables {
  fileId: string
}

export interface UploadUrlResponse {
  presignedUrl: string
  fileKey: string
  fileUrl: string
  expiresIn: number
}

export interface FileUploadProgress {
  fileKey: string
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'failed'
  error?: string
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single file by ID
 */
export const GET_FILE = gql`
  query GetFile($id: uuid!) {
    nchat_attachments_by_pk(id: $id) {
      ...Attachment
      message {
        id
        content
        created_at
        user {
          ...UserBasic
        }
        channel {
          ...ChannelBasic
        }
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
  ${CHANNEL_BASIC_FRAGMENT}
`

/**
 * Get all files in a channel
 */
export const GET_CHANNEL_FILES = gql`
  query GetChannelFiles(
    $channelId: uuid!
    $fileType: String
    $limit: Int = 50
    $offset: Int = 0
  ) {
    nchat_attachments(
      where: {
        message: {
          channel_id: { _eq: $channelId }
          is_deleted: { _eq: false }
        }
        file_type: { _ilike: $fileType }
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...Attachment
      message {
        id
        created_at
        user {
          ...UserBasic
        }
      }
    }
    nchat_attachments_aggregate(
      where: {
        message: {
          channel_id: { _eq: $channelId }
          is_deleted: { _eq: false }
        }
        file_type: { _ilike: $fileType }
      }
    ) {
      aggregate {
        count
        sum {
          file_size
        }
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
`

/**
 * Get files by type (images, videos, documents, etc.)
 */
export const GET_FILES_BY_TYPE = gql`
  query GetFilesByType($channelId: uuid!, $limit: Int = 20) {
    images: nchat_attachments(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: { _ilike: "image/%" }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      ...Attachment
    }

    videos: nchat_attachments(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: { _ilike: "video/%" }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      ...Attachment
    }

    documents: nchat_attachments(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: {
          _in: [
            "application/pdf"
            "application/msword"
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "text/plain"
          ]
        }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      ...Attachment
    }

    audio: nchat_attachments(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: { _ilike: "audio/%" }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      ...Attachment
    }

    archives: nchat_attachments(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: {
          _in: [
            "application/zip"
            "application/x-rar-compressed"
            "application/x-7z-compressed"
            "application/x-tar"
          ]
        }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      ...Attachment
    }
  }
  ${ATTACHMENT_FRAGMENT}
`

/**
 * Get recent files shared by a user
 */
export const GET_USER_FILES = gql`
  query GetUserFiles($userId: uuid!, $limit: Int = 50, $offset: Int = 0) {
    nchat_attachments(
      where: {
        message: {
          user_id: { _eq: $userId }
          is_deleted: { _eq: false }
        }
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...Attachment
      message {
        id
        channel {
          ...ChannelBasic
        }
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
  ${CHANNEL_BASIC_FRAGMENT}
`

/**
 * Get attachments for a specific message
 */
export const GET_MESSAGE_FILES = gql`
  query GetMessageFiles($messageId: uuid!) {
    nchat_attachments(
      where: { message_id: { _eq: $messageId } }
      order_by: { created_at: asc }
    ) {
      ...Attachment
    }
  }
  ${ATTACHMENT_FRAGMENT}
`

/**
 * Get file statistics for a channel
 */
export const GET_CHANNEL_FILE_STATS = gql`
  query GetChannelFileStats($channelId: uuid!) {
    total: nchat_attachments_aggregate(
      where: { message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } } }
    ) {
      aggregate {
        count
        sum {
          file_size
        }
      }
    }

    images: nchat_attachments_aggregate(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: { _ilike: "image/%" }
      }
    ) {
      aggregate {
        count
        sum {
          file_size
        }
      }
    }

    videos: nchat_attachments_aggregate(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: { _ilike: "video/%" }
      }
    ) {
      aggregate {
        count
        sum {
          file_size
        }
      }
    }

    documents: nchat_attachments_aggregate(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: { _in: ["application/pdf", "application/msword", "text/plain"] }
      }
    ) {
      aggregate {
        count
        sum {
          file_size
        }
      }
    }

    audio: nchat_attachments_aggregate(
      where: {
        message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
        file_type: { _ilike: "audio/%" }
      }
    ) {
      aggregate {
        count
        sum {
          file_size
        }
      }
    }
  }
`

/**
 * Get storage usage for workspace
 */
export const GET_STORAGE_USAGE = gql`
  query GetStorageUsage {
    total: nchat_attachments_aggregate {
      aggregate {
        count
        sum {
          file_size
        }
      }
    }

    by_user: nchat_attachments(
      distinct_on: [message: { user_id }]
      order_by: { message: { user_id: asc } }
    ) {
      message {
        user {
          id
          display_name
        }
      }
    }

    by_type: nchat_attachments(
      distinct_on: file_type
      order_by: { file_type: asc }
    ) {
      file_type
    }
  }
`

/**
 * Search files by name or type
 */
export const SEARCH_FILES = gql`
  query SearchFiles(
    $query: String!
    $channelId: uuid
    $fileType: String
    $limit: Int = 20
    $offset: Int = 0
  ) {
    nchat_attachments(
      where: {
        _and: [
          { file_name: { _ilike: $query } }
          { file_type: { _ilike: $fileType } }
          { message: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } } }
        ]
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...Attachment
      message {
        id
        created_at
        user {
          ...UserBasic
        }
        channel {
          ...ChannelBasic
        }
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
  ${CHANNEL_BASIC_FRAGMENT}
`

/**
 * Get recent files (workspace-wide)
 */
export const GET_RECENT_FILES = gql`
  query GetRecentFiles($limit: Int = 20) {
    nchat_attachments(
      where: { message: { is_deleted: { _eq: false } } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      ...Attachment
      message {
        id
        created_at
        user {
          ...UserBasic
        }
        channel {
          ...ChannelBasic
        }
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
  ${CHANNEL_BASIC_FRAGMENT}
`

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Request presigned URL for file upload
 */
export const REQUEST_UPLOAD_URL = gql`
  mutation RequestUploadUrl(
    $fileName: String!
    $contentType: String!
    $fileSize: Int!
    $channelId: uuid
  ) {
    request_upload_url(
      file_name: $fileName
      content_type: $contentType
      file_size: $fileSize
      channel_id: $channelId
    ) {
      presigned_url
      file_key
      file_url
      expires_in
    }
  }
`

/**
 * Create file record after upload
 */
export const CREATE_FILE = gql`
  mutation CreateFile(
    $messageId: uuid!
    $fileName: String!
    $fileType: String!
    $fileSize: Int!
    $fileUrl: String!
    $thumbnailUrl: String
    $width: Int
    $height: Int
    $duration: Int
    $metadata: jsonb
  ) {
    insert_nchat_attachments_one(
      object: {
        message_id: $messageId
        file_name: $fileName
        file_type: $fileType
        file_size: $fileSize
        file_url: $fileUrl
        thumbnail_url: $thumbnailUrl
        width: $width
        height: $height
        duration: $duration
        metadata: $metadata
      }
    ) {
      ...Attachment
    }
  }
  ${ATTACHMENT_FRAGMENT}
`

/**
 * Create multiple files at once
 */
export const CREATE_FILES = gql`
  mutation CreateFiles($files: [nchat_attachments_insert_input!]!) {
    insert_nchat_attachments(objects: $files) {
      affected_rows
      returning {
        ...Attachment
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
`

/**
 * Delete a file
 */
export const DELETE_FILE = gql`
  mutation DeleteFile($id: uuid!) {
    delete_nchat_attachments_by_pk(id: $id) {
      id
      file_url
      thumbnail_url
      file_name
    }
  }
`

/**
 * Delete all files for a message
 */
export const DELETE_MESSAGE_FILES = gql`
  mutation DeleteMessageFiles($messageId: uuid!) {
    delete_nchat_attachments(
      where: { message_id: { _eq: $messageId } }
    ) {
      affected_rows
      returning {
        id
        file_url
        thumbnail_url
      }
    }
  }
`

/**
 * Bulk delete files
 */
export const BULK_DELETE_FILES = gql`
  mutation BulkDeleteFiles($ids: [uuid!]!) {
    delete_nchat_attachments(
      where: { id: { _in: $ids } }
    ) {
      affected_rows
      returning {
        id
        file_url
        thumbnail_url
        file_name
      }
    }
  }
`

/**
 * Update file metadata
 */
export const UPDATE_FILE_METADATA = gql`
  mutation UpdateFileMetadata($id: uuid!, $metadata: jsonb!) {
    update_nchat_attachments_by_pk(
      pk_columns: { id: $id }
      _append: { metadata: $metadata }
    ) {
      id
      metadata
      updated_at
    }
  }
`

/**
 * Generate thumbnail for image/video
 */
export const GENERATE_THUMBNAIL = gql`
  mutation GenerateThumbnail($fileId: uuid!) {
    generate_thumbnail(file_id: $fileId) {
      thumbnail_url
      width
      height
    }
  }
`

/**
 * Confirm upload completion
 */
export const CONFIRM_FILE_UPLOAD = gql`
  mutation ConfirmFileUpload(
    $fileKey: String!
    $messageId: uuid!
    $metadata: jsonb
  ) {
    confirm_upload(
      file_key: $fileKey
      message_id: $messageId
      metadata: $metadata
    ) {
      attachment {
        ...Attachment
      }
      success
      error
    }
  }
  ${ATTACHMENT_FRAGMENT}
`

/**
 * Get download URL for a file
 */
export const GET_DOWNLOAD_URL = gql`
  mutation GetDownloadUrl($fileId: uuid!) {
    get_download_url(file_id: $fileId) {
      download_url
      expires_in
    }
  }
`

/**
 * Update file name
 */
export const UPDATE_FILE_NAME = gql`
  mutation UpdateFileName($id: uuid!, $fileName: String!) {
    update_nchat_attachments_by_pk(
      pk_columns: { id: $id }
      _set: { file_name: $fileName }
    ) {
      id
      file_name
    }
  }
`

/**
 * Process uploaded file (generate thumbnails, extract metadata, etc.)
 */
export const PROCESS_FILE = gql`
  mutation ProcessFile($fileId: uuid!) {
    process_file(file_id: $fileId) {
      success
      thumbnail_url
      width
      height
      duration
      metadata
      error
    }
  }
`

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to new files in a channel
 */
export const CHANNEL_FILES_SUBSCRIPTION = gql`
  subscription ChannelFilesSubscription($channelId: uuid!) {
    nchat_attachments(
      where: { message: { channel_id: { _eq: $channelId } } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      ...Attachment
      message {
        id
        user {
          ...UserBasic
        }
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
`

/**
 * Subscribe to file upload progress
 */
export const FILE_UPLOAD_PROGRESS_SUBSCRIPTION = gql`
  subscription FileUploadProgressSubscription($fileKey: String!) {
    file_upload_progress(file_key: $fileKey) {
      file_key
      progress
      status
      error
    }
  }
`

/**
 * Subscribe to file stream
 */
export const FILES_STREAM_SUBSCRIPTION = gql`
  subscription FilesStreamSubscription($channelId: uuid) {
    nchat_attachments_stream(
      cursor: { initial_value: { created_at: "now()" } }
      batch_size: 10
      where: { message: { channel_id: { _eq: $channelId } } }
    ) {
      ...Attachment
      message {
        id
        channel_id
        user {
          ...UserBasic
        }
      }
    }
  }
  ${ATTACHMENT_FRAGMENT}
  ${USER_BASIC_FRAGMENT}
`
