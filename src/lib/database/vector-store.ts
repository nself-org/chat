/**
 * Vector Store - PostgreSQL pgvector operations
 *
 * Provides high-level interface for vector similarity search and embedding management.
 * Uses pgvector extension for efficient nearest-neighbor search.
 *
 * @module lib/database/vector-store
 */

import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

// ========================================
// Types
// ========================================

export interface VectorSearchResult {
  messageId: string;
  content: string;
  similarity: number;
  channelId: string;
  userId: string;
  createdAt: string;
}

export interface EmbeddingMetadata {
  model: string;
  version: string;
  createdAt: string;
  error?: string;
  retryCount?: number;
}

export interface BatchEmbeddingOperation {
  messageId: string;
  embedding: number[];
  metadata: Omit<EmbeddingMetadata, 'createdAt'>;
}

export interface VectorIndexHealth {
  indexName: string;
  indexSize: string;
  totalVectors: number;
  indexEfficiency: number;
}

export interface EmbeddingCoverage {
  totalMessages: number;
  messagesWithEmbeddings: number;
  coveragePercentage: number;
  pendingEmbeddings: number;
  failedEmbeddings: number;
  oldestUnembeddedMessage?: string;
}

export type DistanceMetric = 'cosine' | 'l2' | 'inner_product';

// ========================================
// GraphQL Queries
// ========================================

const SEARCH_MESSAGES_BY_EMBEDDING = gql`
  query SearchMessagesByEmbedding(
    $embedding: String!
    $matchThreshold: Float
    $matchCount: Int
    $channelId: uuid
    $userId: uuid
  ) {
    search_messages_by_embedding(
      args: {
        query_embedding: $embedding
        match_threshold: $matchThreshold
        match_count: $matchCount
        filter_channel_id: $channelId
        filter_user_id: $userId
      }
    ) {
      message_id
      content
      similarity
      channel_id
      user_id
      created_at
    }
  }
`;

const INSERT_EMBEDDING = gql`
  mutation InsertEmbedding(
    $messageId: uuid!
    $embedding: String!
    $model: String!
    $version: String!
  ) {
    update_nchat_messages_by_pk(
      pk_columns: { id: $messageId }
      _set: {
        embedding: $embedding
        embedding_model: $model
        embedding_version: $version
        embedding_created_at: "now()"
        embedding_error: null
        embedding_retry_count: 0
      }
    ) {
      id
      embedding_model
      embedding_version
      embedding_created_at
    }
  }
`;

const BATCH_INSERT_EMBEDDINGS = gql`
  mutation BatchInsertEmbeddings($updates: [nchat_messages_updates!]!) {
    update_nchat_messages_many(updates: $updates) {
      affected_rows
    }
  }
`;

const GET_EMBEDDING_COVERAGE = gql`
  query GetEmbeddingCoverage {
    get_embedding_coverage {
      total_messages
      messages_with_embeddings
      coverage_percentage
      pending_embeddings
      failed_embeddings
      oldest_unembedded_message
    }
  }
`;

const GET_EMBEDDING_INDEX_HEALTH = gql`
  query GetEmbeddingIndexHealth {
    get_embedding_index_health {
      index_name
      index_size
      total_vectors
      index_efficiency
    }
  }
`;

const DELETE_EMBEDDING = gql`
  mutation DeleteEmbedding($messageId: uuid!) {
    update_nchat_messages_by_pk(
      pk_columns: { id: $messageId }
      _set: {
        embedding: null
        embedding_model: null
        embedding_version: null
        embedding_created_at: null
        embedding_error: null
        embedding_retry_count: 0
      }
    ) {
      id
    }
  }
`;

const RECORD_EMBEDDING_ERROR = gql`
  mutation RecordEmbeddingError(
    $messageId: uuid!
    $error: String!
    $retryCount: Int!
  ) {
    update_nchat_messages_by_pk(
      pk_columns: { id: $messageId }
      _set: {
        embedding_error: $error
        embedding_retry_count: $retryCount
      }
    ) {
      id
      embedding_error
      embedding_retry_count
    }
  }
`;

// ========================================
// Vector Store Class
// ========================================

export class VectorStore {
  private client = apolloClient;

  /**
   * Search messages by semantic similarity
   */
  async search(
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      channelId?: string;
      userId?: string;
      metric?: DistanceMetric;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const {
      threshold = 0.7,
      limit = 10,
      channelId,
      userId,
    } = options;

    try {
      const { data, errors } = await this.client.query({
        query: SEARCH_MESSAGES_BY_EMBEDDING,
        variables: {
          embedding: JSON.stringify(queryEmbedding),
          matchThreshold: threshold,
          matchCount: limit,
          channelId: channelId || null,
          userId: userId || null,
        },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        throw new Error(`Vector search failed: ${errors[0].message}`);
      }

      return data.search_messages_by_embedding.map((result: any) => ({
        messageId: result.message_id,
        content: result.content,
        similarity: result.similarity,
        channelId: result.channel_id,
        userId: result.user_id,
        createdAt: result.created_at,
      }));
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  /**
   * Insert or update embedding for a message
   */
  async insertEmbedding(
    messageId: string,
    embedding: number[],
    metadata: Omit<EmbeddingMetadata, 'createdAt'>
  ): Promise<void> {
    try {
      const { errors } = await this.client.mutate({
        mutation: INSERT_EMBEDDING,
        variables: {
          messageId,
          embedding: JSON.stringify(embedding),
          model: metadata.model,
          version: metadata.version,
        },
      });

      if (errors) {
        throw new Error(`Insert embedding failed: ${errors[0].message}`);
      }
    } catch (error) {
      console.error('Insert embedding error:', error);
      throw error;
    }
  }

  /**
   * Batch insert embeddings for multiple messages
   * More efficient than individual inserts for bulk operations
   */
  async batchInsertEmbeddings(
    operations: BatchEmbeddingOperation[]
  ): Promise<number> {
    if (operations.length === 0) {
      return 0;
    }

    try {
      const updates = operations.map((op) => ({
        where: { id: { _eq: op.messageId } },
        _set: {
          embedding: JSON.stringify(op.embedding),
          embedding_model: op.metadata.model,
          embedding_version: op.metadata.version,
          embedding_created_at: 'now()',
          embedding_error: null,
          embedding_retry_count: 0,
        },
      }));

      const { data, errors } = await this.client.mutate({
        mutation: BATCH_INSERT_EMBEDDINGS,
        variables: { updates },
      });

      if (errors) {
        throw new Error(`Batch insert embeddings failed: ${errors[0].message}`);
      }

      return data.update_nchat_messages_many.reduce(
        (sum: number, result: any) => sum + result.affected_rows,
        0
      );
    } catch (error) {
      console.error('Batch insert embeddings error:', error);
      throw error;
    }
  }

  /**
   * Delete embedding for a message
   */
  async deleteEmbedding(messageId: string): Promise<void> {
    try {
      const { errors } = await this.client.mutate({
        mutation: DELETE_EMBEDDING,
        variables: { messageId },
      });

      if (errors) {
        throw new Error(`Delete embedding failed: ${errors[0].message}`);
      }
    } catch (error) {
      console.error('Delete embedding error:', error);
      throw error;
    }
  }

  /**
   * Record embedding error for retry tracking
   */
  async recordError(
    messageId: string,
    error: string,
    retryCount: number
  ): Promise<void> {
    try {
      const { errors } = await this.client.mutate({
        mutation: RECORD_EMBEDDING_ERROR,
        variables: {
          messageId,
          error: error.substring(0, 500), // Limit error length
          retryCount,
        },
      });

      if (errors) {
        console.error('Failed to record embedding error:', errors[0].message);
      }
    } catch (err) {
      console.error('Record embedding error failed:', err);
    }
  }

  /**
   * Get embedding coverage statistics
   */
  async getCoverage(): Promise<EmbeddingCoverage> {
    try {
      const { data, errors } = await this.client.query({
        query: GET_EMBEDDING_COVERAGE,
        fetchPolicy: 'network-only',
      });

      if (errors) {
        throw new Error(`Get coverage failed: ${errors[0].message}`);
      }

      const result = data.get_embedding_coverage[0];
      return {
        totalMessages: result.total_messages,
        messagesWithEmbeddings: result.messages_with_embeddings,
        coveragePercentage: result.coverage_percentage,
        pendingEmbeddings: result.pending_embeddings,
        failedEmbeddings: result.failed_embeddings,
        oldestUnembeddedMessage: result.oldest_unembedded_message,
      };
    } catch (error) {
      console.error('Get coverage error:', error);
      throw error;
    }
  }

  /**
   * Get vector index health metrics
   */
  async getIndexHealth(): Promise<VectorIndexHealth> {
    try {
      const { data, errors } = await this.client.query({
        query: GET_EMBEDDING_INDEX_HEALTH,
        fetchPolicy: 'network-only',
      });

      if (errors) {
        throw new Error(`Get index health failed: ${errors[0].message}`);
      }

      const result = data.get_embedding_index_health[0];
      return {
        indexName: result.index_name,
        indexSize: result.index_size,
        totalVectors: result.total_vectors,
        indexEfficiency: result.index_efficiency,
      };
    } catch (error) {
      console.error('Get index health error:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Calculate L2 (Euclidean) distance between two vectors
   */
  static l2Distance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Calculate inner product between two vectors
   */
  static innerProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  /**
   * Normalize a vector to unit length
   */
  static normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) {
      return vector;
    }
    return vector.map((val) => val / norm);
  }

  /**
   * Calculate average of multiple vectors
   */
  static averageVectors(vectors: number[][]): number[] {
    if (vectors.length === 0) {
      throw new Error('Cannot average empty vector list');
    }

    const dimension = vectors[0].length;
    const result = new Array(dimension).fill(0);

    for (const vector of vectors) {
      if (vector.length !== dimension) {
        throw new Error('All vectors must have the same dimension');
      }
      for (let i = 0; i < dimension; i++) {
        result[i] += vector[i];
      }
    }

    return result.map((val) => val / vectors.length);
  }
}

// Export singleton instance
export const vectorStore = new VectorStore();
