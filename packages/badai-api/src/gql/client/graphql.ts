/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AgentID: { input: any; output: any; }
  AttachmentID: { input: any; output: any; }
  BalanceSubscriptionID: { input: any; output: any; }
  BlobBase64: { input: string; output: string; }
  ChatID: { input: any; output: any; }
  ChunkID: { input: any; output: any; }
  CmcApiKey: { input: any; output: any; }
  CollectionID: { input: any; output: any; }
  Credits: { input: any; output: any; }
  Decimal: { input: any; output: any; }
  DocumentID: { input: any; output: any; }
  Duration: { input: any; output: any; }
  ECDHPublicKeyP256: { input: string; output: string; }
  Email: { input: any; output: any; }
  ExternalAccountID: { input: any; output: any; }
  GraphID: { input: any; output: any; }
  JSON: { input: any; output: any; }
  MemoryFragmentID: { input: any; output: any; }
  MessageID: { input: any; output: any; }
  MetamaskAddress: { input: any; output: any; }
  MetamaskMessage: { input: any; output: any; }
  PageID: { input: any; output: any; }
  ParticipantID: { input: any; output: any; }
  PartnerID: { input: any; output: any; }
  PaymentID: { input: any; output: any; }
  SecretID: { input: any; output: any; }
  SerializedGraph: { input: any; output: any; }
  Session: { input: any; output: any; }
  SubscriptionID: { input: any; output: any; }
  TaskID: { input: any; output: any; }
  TelegramBotID: { input: any; output: any; }
  Time: { input: any; output: any; }
  TweetID: { input: any; output: any; }
  TwitterUserID: { input: any; output: any; }
  UserID: { input: any; output: any; }
  Username: { input: any; output: any; }
  _Any: { input: any; output: any; }
  _FieldSet: { input: any; output: any; }
};

export type AgentCollection = {
  __typename?: 'AgentCollection';
  agents: Array<AgentMeta>;
  collection_id: Scalars['String']['output'];
  description: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  owner_id: Scalars['UserID']['output'];
  title: Scalars['String']['output'];
  updated_at: Scalars['Time']['output'];
};

/** A meta information about the agent */
export type AgentMeta = {
  __typename?: 'AgentMeta';
  agent_id: Scalars['AgentID']['output'];
  avatar: Scalars['String']['output'];
  /** can_answer is a flag to enable the agent to answer to the messages. If the flag is set to true, then the agent can answer to the messages. If the flag is set to false, then the agent reactions will be disabled */
  can_answer: Scalars['Boolean']['output'];
  chain_graph_id: Scalars['GraphID']['output'];
  /** @deprecated Use template_params instead */
  chat_history_config: ChatHistoryConfig;
  deployment_status: DeploymentStatus;
  first_name: Scalars['String']['output'];
  is_agent: Scalars['Boolean']['output'];
  /** is_need_reply_to_message is a flag to enable reply to message from the agent. If the flag is set to true, then the messages from the agent will be available for reply */
  is_need_reply_to_message: Scalars['Boolean']['output'];
  last_name?: Maybe<Scalars['String']['output']>;
  llm_config: LlmConfig;
  /** @deprecated Use template_params instead */
  llm_model: Scalars['String']['output'];
  /** owner_id is the user id of the agent owner */
  owner_id: Scalars['UserID']['output'];
  /** @deprecated Use template_params instead */
  prompt: Scalars['String']['output'];
  /** @deprecated Use template_params instead */
  purpose: Scalars['String']['output'];
  /** role is the description of the agent role */
  role: Scalars['String']['output'];
  /** @deprecated Use template_params instead */
  self_awareness: Scalars['String']['output'];
  skeleton: Scalars['String']['output'];
  social: AgentSocial;
  stats: AgentStats;
  template_params: Scalars['JSON']['output'];
  token_address?: Maybe<Scalars['String']['output']>;
  token_metrics?: Maybe<AgentTokenMetrics>;
  /** @deprecated Use template_params instead */
  tools: Array<Tool>;
  username: Scalars['Username']['output'];
};

export type AgentSocial = {
  __typename?: 'AgentSocial';
  telegram_link?: Maybe<Scalars['String']['output']>;
  token_buy_link?: Maybe<Scalars['String']['output']>;
  x_link?: Maybe<Scalars['String']['output']>;
  youtube_link?: Maybe<Scalars['String']['output']>;
};

export type AgentSocialInput = {
  telegram_link?: InputMaybe<Scalars['String']['input']>;
  x_link?: InputMaybe<Scalars['String']['input']>;
  youtube_link?: InputMaybe<Scalars['String']['input']>;
};

export type AgentStats = {
  __typename?: 'AgentStats';
  total_chats: Scalars['Int']['output'];
  total_messages: Scalars['Int']['output'];
  total_users: Scalars['Int']['output'];
};

export type AgentTokenMetrics = {
  __typename?: 'AgentTokenMetrics';
  image_url: Scalars['String']['output'];
  market_cap: Scalars['Decimal']['output'];
  name: Scalars['String']['output'];
  price_change_24h: Scalars['Decimal']['output'];
  price_usd: Scalars['Decimal']['output'];
  symbol: Scalars['String']['output'];
  token_address: Scalars['String']['output'];
  total_liquidity_usd: Scalars['Decimal']['output'];
  transactions_24h: Scalars['Int']['output'];
  volume_24h: Scalars['Decimal']['output'];
};

export type AgentTriggeredSignal = Signal & {
  __typename?: 'AgentTriggeredSignal';
  agent_id: Scalars['AgentID']['output'];
  message_id?: Maybe<Scalars['MessageID']['output']>;
};

export type Attachment = {
  __typename?: 'Attachment';
  filename: Scalars['String']['output'];
  id: Scalars['AttachmentID']['output'];
  mime_type: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
};

export type AttachmentBlob = {
  blob: Scalars['BlobBase64']['input'];
  filename: Scalars['String']['input'];
};

export type Balance = {
  __typename?: 'Balance';
  daily?: Maybe<BalanceLimitation>;
  monthly?: Maybe<BalanceLimitation>;
  tariff: UserTariff;
};

export type BalanceLimitation = {
  __typename?: 'BalanceLimitation';
  limit: Scalars['Credits']['output'];
  remaining: Scalars['Credits']['output'];
  reset_seconds: Scalars['Int']['output'];
};

export type BalanceUpdate = {
  __typename?: 'BalanceUpdate';
  balance: Balance;
  sub_id: Scalars['BalanceSubscriptionID']['output'];
};

export type CtPostReference = {
  __typename?: 'CTPostReference';
  avatar: Scalars['String']['output'];
  published_at: Scalars['Time']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type ChainGraph = {
  __typename?: 'ChainGraph';
  author: Scalars['ParticipantID']['output'];
  created_at: Scalars['Time']['output'];
  graph: Scalars['SerializedGraph']['output'];
  graph_id: Scalars['GraphID']['output'];
};

export type ChainGraphHistory = {
  __typename?: 'ChainGraphHistory';
  author_id: Scalars['ParticipantID']['output'];
  author_name: Scalars['String']['output'];
  created_at: Scalars['Time']['output'];
  graph_id: Scalars['GraphID']['output'];
};

export type ChainGraphInput = {
  graph: Scalars['String']['input'];
  graph_id?: InputMaybe<Scalars['GraphID']['input']>;
};

export type ChatHistoryConfig = {
  __typename?: 'ChatHistoryConfig';
  messages_count: Scalars['Int']['output'];
  tokens_limit: Scalars['Int']['output'];
};

export type ChatHistoryConfigInput = {
  messages_count: Scalars['Int']['input'];
  tokens_limit: Scalars['Int']['input'];
};

export type ChatRoom = {
  __typename?: 'ChatRoom';
  author: Scalars['ParticipantID']['output'];
  created_at: Scalars['Time']['output'];
  deleted: Scalars['Boolean']['output'];
  deleted_at?: Maybe<Scalars['Time']['output']>;
  id: Scalars['ChatID']['output'];
  last_message?: Maybe<Message>;
  last_message_time?: Maybe<Scalars['Time']['output']>;
  meta: Scalars['JSON']['output'];
  name: Scalars['String']['output'];
  participants?: Maybe<Array<Participant>>;
  updated_at: Scalars['Time']['output'];
};

export type ChatRoomEvent = {
  __typename?: 'ChatRoomEvent';
  chat_rooms?: Maybe<Array<ChatRoom>>;
  event: ChatRoomEventType;
  participants?: Maybe<Array<Participant>>;
  sub_id: Scalars['SubscriptionID']['output'];
};

export enum ChatRoomEventType {
  ContinueCompletion = 'CONTINUE_COMPLETION',
  Created = 'CREATED',
  Deleted = 'DELETED',
  Edited = 'EDITED',
  HistoryLoaded = 'HISTORY_LOADED',
  ParticipantAdded = 'PARTICIPANT_ADDED',
  ParticipantRemoved = 'PARTICIPANT_REMOVED',
  ParticipantUpdated = 'PARTICIPANT_UPDATED',
  RegenerateResponse = 'REGENERATE_RESPONSE',
  StopCompletion = 'STOP_COMPLETION',
  Subscribed = 'SUBSCRIBED',
  Unsubscribed = 'UNSUBSCRIBED'
}

export type Chunk = {
  __typename?: 'Chunk';
  chunk_id: Scalars['ChunkID']['output'];
  chunk_number: Scalars['Int']['output'];
  content: Scalars['String']['output'];
  created_at: Scalars['Time']['output'];
  document_id: Scalars['DocumentID']['output'];
  indexing_state: IndexingState;
  page_number_from: Scalars['Int']['output'];
  page_number_to: Scalars['Int']['output'];
  task_id: Scalars['TaskID']['output'];
};

export type ChunkInput = {
  chunk_number: Scalars['Int']['input'];
  content: Scalars['String']['input'];
  document_id: Scalars['DocumentID']['input'];
  page_number_from: Scalars['Int']['input'];
  page_number_to: Scalars['Int']['input'];
  task_id: Scalars['TaskID']['input'];
};

export type Collection = {
  __typename?: 'Collection';
  agent_id: Scalars['AgentID']['output'];
  collection_id: Scalars['CollectionID']['output'];
  created_at: Scalars['Time']['output'];
  creator_address: Scalars['String']['output'];
  description: Scalars['String']['output'];
  indexing_state: IndexingState;
  name: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
};

export type CollectionWithDocuments = {
  __typename?: 'CollectionWithDocuments';
  collection: Collection;
  documents: Array<DocumentMeta>;
};

export type CreateAgentCollectionInput = {
  agent_id: Scalars['AgentID']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type CreateAgentInput = {
  avatar: Scalars['String']['input'];
  chain_graph_id: Scalars['GraphID']['input'];
  chat_history_config: ChatHistoryConfigInput;
  first_name: Scalars['String']['input'];
  last_name: Scalars['String']['input'];
  llm_config: LlmConfigInput;
  prompt: Scalars['String']['input'];
  role: Scalars['String']['input'];
  skeleton: Scalars['String']['input'];
  social?: InputMaybe<AgentSocialInput>;
  telegram_config?: InputMaybe<TelegramConfigInput>;
  template_params: Scalars['JSON']['input'];
  token_address?: InputMaybe<Scalars['String']['input']>;
  username: Scalars['Username']['input'];
};

export type CreateParticipantCollectionInput = {
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  participant_id: Scalars['ParticipantID']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type CreateQaInput = {
  chunk_id: Scalars['ChunkID']['input'];
  cost: IndexingCost;
  document_id: Scalars['DocumentID']['input'];
  model?: InputMaybe<Scalars['String']['input']>;
  page_number_from: Scalars['Int']['input'];
  page_number_to: Scalars['Int']['input'];
  qas: Array<QaInput>;
  task_id: Scalars['TaskID']['input'];
};

/** Parameters of the createSecret mutation. */
export type CreateSecretParams = {
  /** Name of the secret. */
  name: Scalars['String']['input'];
  /** Type of the secret. */
  type: Scalars['String']['input'];
  /** Unencrypted secret value. */
  value: Scalars['JSON']['input'];
};

/** Response to the createSecret mutation. */
export type CreateSecretResponse = {
  __typename?: 'CreateSecretResponse';
  /** ID of the created secret. */
  id: Scalars['SecretID']['output'];
};

export type CreateTripletInput = {
  chunk_id: Scalars['ChunkID']['input'];
  cost: IndexingCost;
  document_id: Scalars['DocumentID']['input'];
  task_id: Scalars['TaskID']['input'];
  triplets: Array<TripletInput>;
};

export type CurrentPriceRequest = {
  currency: Array<Scalars['String']['input']>;
};

export type CurrentPriceResponse = {
  __typename?: 'CurrentPriceResponse';
  prices: Array<PairPrice>;
};

export type DecodingResult = {
  __typename?: 'DecodingResult';
  avg_logprob: Scalars['Float']['output'];
  compression_ratio: Scalars['Float']['output'];
  language: Scalars['String']['output'];
  no_speech_prob: Scalars['Float']['output'];
  temperature: Scalars['Float']['output'];
  text: Scalars['String']['output'];
  tokens: Array<Scalars['Int']['output']>;
};

/** Parameters of the deleteSecret mutation. */
export type DeleteSecretParams = {
  /** ID of the secret to be deleted. */
  id: Scalars['SecretID']['input'];
};

/** Response to the deleteSecret mutation. */
export type DeleteSecretResponse = {
  __typename?: 'DeleteSecretResponse';
  /** ID of the deleted secret. */
  id: Scalars['SecretID']['output'];
};

export type DeployPayment = {
  __typename?: 'DeployPayment';
  link: Scalars['String']['output'];
};

export enum DeploymentStatus {
  DeployedPrivate = 'deployed_private',
  DeployedPublic = 'deployed_public',
  Paid = 'paid',
  Unpaid = 'unpaid'
}

export enum DeploymentType {
  Private = 'Private',
  Public = 'Public'
}

export type DocumentIndexingState = {
  __typename?: 'DocumentIndexingState';
  failed_reason?: Maybe<Scalars['String']['output']>;
  is_indexing: Scalars['Boolean']['output'];
  is_indexing_accepted: Scalars['Boolean']['output'];
  is_indexing_failed: Scalars['Boolean']['output'];
  is_indexing_finished: Scalars['Boolean']['output'];
  is_indexing_paused: Scalars['Boolean']['output'];
};

export type DocumentMeta = {
  __typename?: 'DocumentMeta';
  collection_id: Scalars['CollectionID']['output'];
  created_at: Scalars['Time']['output'];
  description?: Maybe<Scalars['String']['output']>;
  document_id: Scalars['DocumentID']['output'];
  document_indexing_state: DocumentIndexingState;
  indexing_state: IndexingState;
  metadata: Array<DocumentMetadataKv>;
  name?: Maybe<Scalars['String']['output']>;
  published_at: Scalars['Time']['output'];
  tags: Array<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type DocumentMetaInput = {
  collection_id: Scalars['CollectionID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  metadata: Array<DocumentMetadataKvInput>;
  name: Scalars['String']['input'];
  published_at?: InputMaybe<Scalars['Time']['input']>;
  tags: Array<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};

export type DocumentMetadataKv = {
  __typename?: 'DocumentMetadataKV';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type DocumentMetadataKvInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

/**
 * DocumentOrderByField specifies the available fields for sorting document results.
 * Represents the field names that can be used to order documents in queries.
 */
export enum DocumentOrderByField {
  /** Order documents by their creation date and time */
  CreatedAt = 'CREATED_AT',
  /** Order documents by their name in alphabetical order */
  Name = 'NAME',
  /** Order documents by their publication date and time */
  PublishedAt = 'PUBLISHED_AT'
}

export enum DocumentType {
  Code = 'code',
  Csv = 'csv',
  Html = 'html',
  Image = 'image',
  Json = 'json',
  Other = 'other',
  Pdf = 'pdf',
  Text = 'text',
  WebPage = 'web_page',
  Xml = 'xml'
}

/** DocumentWithPagesCount represents a document along with its total page count. */
export type DocumentWithPagesCount = {
  __typename?: 'DocumentWithPagesCount';
  /** The main document entity containing document-specific information */
  document: DocumentMeta;
  /** Total number of pages contained in the document */
  pagesCount: Scalars['Int']['output'];
};

export type DocumentWithTasks = {
  __typename?: 'DocumentWithTasks';
  document: DocumentMeta;
  tasks: Array<IndexingDocumentTask>;
};

export enum Event {
  HistoryLoaded = 'HISTORY_LOADED',
  MessageCreated = 'MESSAGE_CREATED',
  MessageDeleted = 'MESSAGE_DELETED',
  MessageDeltaAdd = 'MESSAGE_DELTA_ADD',
  MessageEdited = 'MESSAGE_EDITED',
  MessageFinished = 'MESSAGE_FINISHED',
  Subscribed = 'SUBSCRIBED',
  Unsubscribed = 'UNSUBSCRIBED'
}

export type ExternalAccount = {
  __typename?: 'ExternalAccount';
  ID: Scalars['ExternalAccountID']['output'];
  providerID: ProviderId;
};

/** Input type defining a date range for filtering documents based on their publication dates. */
export type GetDocumentsByCollectionFilterPublishedRange = {
  /**
   * Starting date/time for the publication range filter.
   * Documents published before this time will be excluded.
   */
  from?: InputMaybe<Scalars['Time']['input']>;
  /**
   * Ending date/time for the publication range filter.
   * Documents published after this time will be excluded.
   */
  to?: InputMaybe<Scalars['Time']['input']>;
};

/** Input type for filtering documents by collection with various criteria. */
export type GetDocumentsByCollectionFilters = {
  /** Filter documents based on their publication date range. */
  published_range?: GetDocumentsByCollectionFilterPublishedRange;
};

/**
 * Input type for specifying the sort order of documents within a collection.
 * Defines the field and direction by which documents should be ordered.
 */
export type GetDocumentsByCollectionOrderByInput = {
  /**
   * The sort direction for the specified field.
   * Can be either Asc (ascending) or Desc (descending).
   */
  direction?: OrderDirection;
  /** The field name by which to sort the documents. */
  field: DocumentOrderByField;
};

/** Defines the inclusive range of page numbers to retrieve from a document. */
export type GetPagesByDocumentFilterPagesRange = {
  /**
   * The starting page number of the range (inclusive).
   * Must be a positive integer and less than or equal to the 'to' value.
   */
  from?: InputMaybe<Scalars['Int']['input']>;
  /**
   * The ending page number of the range (inclusive).
   * Must be a positive integer and greater than or equal to the 'from' value.
   */
  to?: InputMaybe<Scalars['Int']['input']>;
};

/** Filters for retrieving specific pages from a document. */
export type GetPagesByDocumentFilters = {
  /** Specifies the range of pages to retrieve from the document. */
  pages_range?: GetPagesByDocumentFilterPagesRange;
};

export type HistoricalPriceRequest = {
  currency: Array<Scalars['String']['input']>;
  market?: Market;
  period?: Period;
};

export type HistoricalPriceResponse = {
  __typename?: 'HistoricalPriceResponse';
  base_currency: Scalars['String']['output'];
  close: Array<Scalars['Float']['output']>;
  high: Array<Scalars['Float']['output']>;
  low: Array<Scalars['Float']['output']>;
  market: Scalars['String']['output'];
  open: Array<Scalars['Float']['output']>;
  quote_currency: Scalars['String']['output'];
  time: Array<Scalars['Int']['output']>;
  volume: Array<Scalars['Float']['output']>;
};

export type IndexingCost = {
  completion_cost: Scalars['Float']['input'];
  completion_tokens: Scalars['Int']['input'];
  embedding_cost: Scalars['Float']['input'];
  prompt_cost: Scalars['Float']['input'];
  prompt_tokens: Scalars['Int']['input'];
};

export type IndexingDocumentStatistics = {
  __typename?: 'IndexingDocumentStatistics';
  chunks_indexed_qa: Scalars['Int']['output'];
  chunks_indexed_triplet: Scalars['Int']['output'];
  chunks_total: Scalars['Int']['output'];
  current_indexing_speed: Scalars['Float']['output'];
  expected_finish_seconds?: Maybe<Scalars['Int']['output']>;
  expected_finished_at?: Maybe<Scalars['Time']['output']>;
  indexed_for_seconds?: Maybe<Scalars['Int']['output']>;
  indexed_percent: Scalars['Float']['output'];
  indexing_started_at?: Maybe<Scalars['Time']['output']>;
  llm_approximate_cost: Scalars['Float']['output'];
  llm_stats: IndexingDocumentStatisticsLlm;
  pages: Scalars['Int']['output'];
  qa_total: Scalars['Int']['output'];
  total_tokens: Scalars['Int']['output'];
  triplets_total: Scalars['Int']['output'];
};

export type IndexingDocumentStatisticsLlm = {
  __typename?: 'IndexingDocumentStatisticsLLM';
  completion_cost: Scalars['Float']['output'];
  embeddings_cost: Scalars['Float']['output'];
  embeddings_count: Scalars['Int']['output'];
  prompt_cost: Scalars['Float']['output'];
  total_cost: Scalars['Float']['output'];
};

export type IndexingDocumentTask = {
  __typename?: 'IndexingDocumentTask';
  author_id: Scalars['ParticipantID']['output'];
  chat_id: Scalars['ChatID']['output'];
  config: IndexingDocumentTaskConfig;
  confirmed: Scalars['Boolean']['output'];
  created_at: Scalars['Time']['output'];
  document_id: Scalars['DocumentID']['output'];
  error?: Maybe<Scalars['String']['output']>;
  message_id: Scalars['MessageID']['output'];
  statistics: IndexingDocumentStatistics;
  task_id: Scalars['TaskID']['output'];
  task_state: IndexingDocumentTaskState;
  update_at: Scalars['Time']['output'];
  version: Scalars['Int']['output'];
};

export type IndexingDocumentTaskConfig = {
  __typename?: 'IndexingDocumentTaskConfig';
  chunk_overlap_tokens: Scalars['Int']['output'];
  chunk_size_tokens: Scalars['Int']['output'];
  cost_limit: Scalars['Float']['output'];
  force_confirm: Scalars['Boolean']['output'];
  instruction_for_qa?: Maybe<Scalars['String']['output']>;
  need_qa: Scalars['Boolean']['output'];
  qa_count_per_run: Scalars['Int']['output'];
  qa_model: Scalars['String']['output'];
};

export enum IndexingDocumentTaskState {
  Accepted = 'accepted',
  Done = 'done',
  Failed = 'failed',
  Parsing = 'parsing',
  PauseRequested = 'pause_requested',
  Paused = 'paused',
  Pending = 'pending',
  QaGenerating = 'qa_generating',
  Rejected = 'rejected',
  WaitingForConfirmation = 'waiting_for_confirmation'
}

export type IndexingState = {
  __typename?: 'IndexingState';
  completion_cost: Scalars['Float']['output'];
  completion_tokens: Scalars['Int']['output'];
  content_tokens: Scalars['Int']['output'];
  embedding_cost: Scalars['Float']['output'];
  is_embedded: Scalars['Boolean']['output'];
  is_indexed_qa: Scalars['Boolean']['output'];
  is_indexed_triplet: Scalars['Boolean']['output'];
  is_parsed: Scalars['Boolean']['output'];
  is_summarized: Scalars['Boolean']['output'];
  prompt_cost: Scalars['Float']['output'];
  prompt_tokens: Scalars['Int']['output'];
};

export type KdbIndexingDocumentTaskCreateInput = {
  chat_id: Scalars['ChatID']['input'];
  chunk_overlap_tokens?: Scalars['Int']['input'];
  chunk_size_tokens?: Scalars['Int']['input'];
  cost_limit?: Scalars['Float']['input'];
  document_id: Scalars['DocumentID']['input'];
  force_confirm?: Scalars['Boolean']['input'];
  instruction_for_qa?: Scalars['String']['input'];
  message_id: Scalars['MessageID']['input'];
  need_qa?: Scalars['Boolean']['input'];
  qa_count_per_run?: Scalars['Int']['input'];
  qa_model?: Scalars['String']['input'];
};

export type KdbIndexingDocumentTaskUpdateConfigInput = {
  chunk_overlap_tokens?: Scalars['Int']['input'];
  chunk_size_tokens?: Scalars['Int']['input'];
  cost_limit?: Scalars['Float']['input'];
  force_confirm?: Scalars['Boolean']['input'];
  instruction_for_qa?: Scalars['String']['input'];
  need_qa?: Scalars['Boolean']['input'];
  qa_count_per_run?: Scalars['Int']['input'];
  qa_model?: Scalars['String']['input'];
};

export type KeyValueInput = {
  key: Scalars['String']['input'];
  value: VariableValueInput;
};

export type LlmConfig = {
  __typename?: 'LLMConfig';
  max_tokens: Scalars['Int']['output'];
  model: Scalars['String']['output'];
  temperature: Scalars['Float']['output'];
};

export type LlmConfigInput = {
  llm_model: Scalars['String']['input'];
  max_tokens: Scalars['Int']['input'];
  temperature: Scalars['Float']['input'];
};

export type LlmUsage = {
  __typename?: 'LLMUsage';
  agent_id: Scalars['AgentID']['output'];
  chat_id: Scalars['ChatID']['output'];
  completion_cost: Scalars['Float']['output'];
  completion_tokens: Scalars['Int']['output'];
  created_at: Scalars['Time']['output'];
  duration: Scalars['Float']['output'];
  message_id: Scalars['MessageID']['output'];
  model_name: Scalars['String']['output'];
  parent_run_id: Scalars['String']['output'];
  participant_id: Scalars['ParticipantID']['output'];
  prompt: Scalars['String']['output'];
  prompt_cost: Scalars['Float']['output'];
  prompt_tokens: Scalars['Int']['output'];
  response: Scalars['String']['output'];
  run_id: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
  usage_id: Scalars['String']['output'];
};

export type LoginResult = {
  __typename?: 'LoginResult';
  session: Scalars['Session']['output'];
  user_profile: UserProfile;
};

export enum Market {
  Coinbase = 'COINBASE',
  Index = 'INDEX',
  Kraken = 'KRAKEN'
}

export type Message = {
  __typename?: 'Message';
  attachments?: Maybe<Array<Attachment>>;
  author: Scalars['ParticipantID']['output'];
  chat_id: Scalars['ChatID']['output'];
  deleted: Scalars['Boolean']['output'];
  error?: Maybe<Scalars['String']['output']>;
  finished: Scalars['Boolean']['output'];
  id: Scalars['MessageID']['output'];
  is_system: Scalars['Boolean']['output'];
  meta: Scalars['JSON']['output'];
  need_answer: Scalars['Boolean']['output'];
  participant?: Maybe<Participant>;
  reply_to?: Maybe<Scalars['MessageID']['output']>;
  signals?: Maybe<Array<Signal>>;
  text: Scalars['String']['output'];
  time: Scalars['Time']['output'];
  total_usage_cost: Scalars['Credits']['output'];
  type: MessageType;
  version: Scalars['Int']['output'];
};

export type MessageEditInput = {
  attachments?: InputMaybe<Array<Scalars['AttachmentID']['input']>>;
  finished: Scalars['Boolean']['input'];
  is_system: Scalars['Boolean']['input'];
  need_answer: Scalars['Boolean']['input'];
  reply_to?: InputMaybe<Scalars['MessageID']['input']>;
  signals?: InputMaybe<Array<SignalInput>>;
  text: Scalars['String']['input'];
};

export type MessageEvent = {
  __typename?: 'MessageEvent';
  event: Event;
  message?: Maybe<Message>;
  messages?: Maybe<Array<Message>>;
  sub_id: Scalars['SubscriptionID']['output'];
};

export type MessageInput = {
  attachments?: InputMaybe<Array<Scalars['AttachmentID']['input']>>;
  error?: InputMaybe<Scalars['String']['input']>;
  finished: Scalars['Boolean']['input'];
  is_system: Scalars['Boolean']['input'];
  need_answer: Scalars['Boolean']['input'];
  reply_to?: InputMaybe<Scalars['MessageID']['input']>;
  signals?: InputMaybe<Array<SignalInput>>;
  text: Scalars['String']['input'];
};

export type MessageMetaInput = {
  meta?: InputMaybe<Array<MessageMetaKv>>;
};

export type MessageMetaKv = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export enum MessageType {
  AgentTrigger = 'agentTrigger',
  Common = 'common',
  Error = 'error',
  Scratchpad = 'scratchpad',
  System = 'system',
  Telegram = 'telegram',
  Thoughts = 'thoughts',
  Twitter = 'twitter'
}

export type MetamaskLoginInput = {
  authMessage: Scalars['MetamaskMessage']['input'];
  sign: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addAgentTelegramIntegration: Scalars['Boolean']['output'];
  addAgentToChat: Scalars['Boolean']['output'];
  addDelta: Message;
  addMessageAttachment: Message;
  adminAddMessageToTelegramChatRoom: Array<Message>;
  adminAddMessageToTwitterChatRoom: Array<Message>;
  adminChangeAgentDeploymentStatus: Scalars['Boolean']['output'];
  adminCreateTelegramChatRoom: ChatRoom;
  adminDeleteTelegramBot: Scalars['Boolean']['output'];
  agentAttachMyXAccount: Scalars['Boolean']['output'];
  agentAttachTwitterUsernames: Scalars['Boolean']['output'];
  agentChangeMyXAccountNotifications: Scalars['Boolean']['output'];
  agentDetachMyXAccount: Scalars['Boolean']['output'];
  agentDetachTwitterUsernames: Scalars['Boolean']['output'];
  appendUsages: Scalars['Boolean']['output'];
  appendVariable: VariableResponse;
  authAgentLogin: LoginResult;
  authGoogleLogin: LoginResult;
  authMetamaskLogin: LoginResult;
  authTelegramLogin: LoginResult;
  authTwitterLogin: LoginResult;
  chainGraphSave: ChainGraph;
  changeAgentDeploymentType: Scalars['Boolean']['output'];
  chatRoomCreateParticipant: Participant;
  chatRoomRemoveParticipant: Scalars['Boolean']['output'];
  chatRoomUpdateParticipant: Participant;
  continueCompletion: Scalars['Boolean']['output'];
  createAgent: AgentMeta;
  createChatRoom: ChatRoom;
  createDeployPaymentForAgent: DeployPayment;
  /** Create the secret owned by the user. */
  createSecret: CreateSecretResponse;
  deleteAgent: Scalars['Boolean']['output'];
  deleteChatRoom: Scalars['Boolean']['output'];
  deleteMessage: Message;
  /** Delete a secret. */
  deleteSecret: DeleteSecretResponse;
  deleteVariable: Scalars['Boolean']['output'];
  deleteVariables: Scalars['Boolean']['output'];
  deployAgent: Scalars['Boolean']['output'];
  editMessage: Message;
  finishMessage: Message;
  kdbCreateAgentCollection: Collection;
  kdbCreateChunk: Array<Chunk>;
  kdbCreateDocument: DocumentMeta;
  kdbCreatePage: Array<Page>;
  kdbCreateQA: Array<Qa>;
  kdbCreateTriplet: Array<Triplet>;
  kdbDeleteAgentCollection: Scalars['Boolean']['output'];
  kdbDeleteChunk: Scalars['Boolean']['output'];
  kdbDeletePage: Scalars['Boolean']['output'];
  kdbDeleteQA: Scalars['Boolean']['output'];
  kdbIndexingDocumentTaskConfirm: IndexingDocumentTask;
  kdbIndexingDocumentTaskCreate: IndexingDocumentTask;
  kdbIndexingDocumentTaskDelete: Scalars['Boolean']['output'];
  kdbIndexingDocumentTaskError: IndexingDocumentTask;
  kdbIndexingDocumentTaskPause: IndexingDocumentTask;
  kdbIndexingDocumentTaskTransitionState: IndexingDocumentTask;
  kdbIndexingDocumentTaskUpdateConfig: IndexingDocumentTask;
  kdbRemoveDocument: Scalars['Boolean']['output'];
  kdbUpdateAgentCollection: Collection;
  kdbUpdateDocument: DocumentMeta;
  kdbUpdatePage: Page;
  kdbUpdateQA: Qa;
  participantPublishToMarketplace: AgentMeta;
  regenerateLastResponse: Scalars['Boolean']['output'];
  removeAgentFromChat: Scalars['Boolean']['output'];
  removeAgentTelegramIntegration: Scalars['Boolean']['output'];
  renameChatRoom: ChatRoom;
  /** Replace a secret with the given secret ID with the given secret if they have the same type. */
  replaceSecret: ReplaceSecretResponse;
  sendMessage: Message;
  setMessageMeta: Message;
  setVariable: VariableResponse;
  setVariables: VariablesResponse;
  stopCompletion: Scalars['Boolean']['output'];
  unsubscribeBalance: Scalars['Boolean']['output'];
  unsubscribeChatRoom: Scalars['Boolean']['output'];
  unsubscribeMessages: Scalars['Boolean']['output'];
  updateAgent: AgentMeta;
  uploadAttachment: Attachment;
  userSetEmail: Scalars['Boolean']['output'];
  voiceToText: DecodingResult;
};


export type MutationAddAgentTelegramIntegrationArgs = {
  agent_id: Scalars['AgentID']['input'];
  bot_token: Scalars['String']['input'];
  session: Scalars['Session']['input'];
};


export type MutationAddAgentToChatArgs = {
  agent_id: Scalars['AgentID']['input'];
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationAddDeltaArgs = {
  chat_id: Scalars['ChatID']['input'];
  delta: Scalars['String']['input'];
  id: Scalars['MessageID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationAddMessageAttachmentArgs = {
  attachment_id: Scalars['AttachmentID']['input'];
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationAdminAddMessageToTelegramChatRoomArgs = {
  message: TelegramMessageInput;
  session: Scalars['Session']['input'];
};


export type MutationAdminAddMessageToTwitterChatRoomArgs = {
  messages: Array<TwitterMessageInput>;
  session: Scalars['Session']['input'];
};


export type MutationAdminChangeAgentDeploymentStatusArgs = {
  payment_id: Scalars['PaymentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationAdminCreateTelegramChatRoomArgs = {
  input: TelegramChatRoomConfigInput;
  session: Scalars['Session']['input'];
};


export type MutationAdminDeleteTelegramBotArgs = {
  session: Scalars['Session']['input'];
  telegram_bot_id: Scalars['Int']['input'];
};


export type MutationAgentAttachMyXAccountArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
  x_api_keys: XApiKeysInput;
};


export type MutationAgentAttachTwitterUsernamesArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
  usernames: Array<Scalars['String']['input']>;
};


export type MutationAgentChangeMyXAccountNotificationsArgs = {
  agent_id: Scalars['AgentID']['input'];
  notifications: MyXAccountNotificationsInput;
  session: Scalars['Session']['input'];
};


export type MutationAgentDetachMyXAccountArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationAgentDetachTwitterUsernamesArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
  usernames: Array<Scalars['String']['input']>;
};


export type MutationAppendUsagesArgs = {
  session: Scalars['Session']['input'];
  usages: Array<UsageInput>;
};


export type MutationAppendVariableArgs = {
  key: Scalars['String']['input'];
  namespace: NamespaceInput;
  session: Scalars['Session']['input'];
  value: VariableValueInput;
};


export type MutationAuthAgentLoginArgs = {
  agentID: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationAuthGoogleLoginArgs = {
  input: OAuthLoginInput;
};


export type MutationAuthMetamaskLoginArgs = {
  input: MetamaskLoginInput;
};


export type MutationAuthTelegramLoginArgs = {
  input: TelegramLoginInput;
};


export type MutationAuthTwitterLoginArgs = {
  input: OAuthLoginInput;
};


export type MutationChainGraphSaveArgs = {
  graph: ChainGraphInput;
  previous_graph_id: Scalars['GraphID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationChangeAgentDeploymentTypeArgs = {
  agent_id: Scalars['AgentID']['input'];
  deployment_type: DeploymentType;
  session: Scalars['Session']['input'];
};


export type MutationChatRoomCreateParticipantArgs = {
  chat_id: Scalars['ChatID']['input'];
  input: ParticipantInput;
  session: Scalars['Session']['input'];
};


export type MutationChatRoomRemoveParticipantArgs = {
  chat_id: Scalars['ChatID']['input'];
  participant_id: Scalars['ParticipantID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationChatRoomUpdateParticipantArgs = {
  chat_id: Scalars['ChatID']['input'];
  input: ParticipantInput;
  participant_id: Scalars['ParticipantID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationContinueCompletionArgs = {
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationCreateAgentArgs = {
  input: CreateAgentInput;
  session: Scalars['Session']['input'];
};


export type MutationCreateChatRoomArgs = {
  agents?: InputMaybe<Array<Scalars['AgentID']['input']>>;
  session: Scalars['Session']['input'];
};


export type MutationCreateDeployPaymentForAgentArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationCreateSecretArgs = {
  params: CreateSecretParams;
  session: Scalars['Session']['input'];
};


export type MutationDeleteAgentArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationDeleteChatRoomArgs = {
  id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationDeleteMessageArgs = {
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationDeleteSecretArgs = {
  params: DeleteSecretParams;
  session: Scalars['Session']['input'];
};


export type MutationDeleteVariableArgs = {
  key: Scalars['String']['input'];
  namespace: NamespaceInput;
  session: Scalars['Session']['input'];
};


export type MutationDeleteVariablesArgs = {
  namespace: NamespaceInput;
  session: Scalars['Session']['input'];
};


export type MutationDeployAgentArgs = {
  agent_id: Scalars['AgentID']['input'];
  deployment_type: DeploymentType;
  session: Scalars['Session']['input'];
};


export type MutationEditMessageArgs = {
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  message: MessageEditInput;
  session: Scalars['Session']['input'];
};


export type MutationFinishMessageArgs = {
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbCreateAgentCollectionArgs = {
  input: CreateAgentCollectionInput;
  session: Scalars['Session']['input'];
};


export type MutationKdbCreateChunkArgs = {
  chunks: Array<ChunkInput>;
  session: Scalars['Session']['input'];
};


export type MutationKdbCreateDocumentArgs = {
  doc: DocumentMetaInput;
  session: Scalars['Session']['input'];
};


export type MutationKdbCreatePageArgs = {
  pages: Array<PageInput>;
  session: Scalars['Session']['input'];
};


export type MutationKdbCreateQaArgs = {
  qa: CreateQaInput;
  session: Scalars['Session']['input'];
};


export type MutationKdbCreateTripletArgs = {
  session: Scalars['Session']['input'];
  triplet: CreateTripletInput;
};


export type MutationKdbDeleteAgentCollectionArgs = {
  collection_id: Scalars['CollectionID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbDeleteChunkArgs = {
  chunk_id: Scalars['ChunkID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbDeletePageArgs = {
  page_id: Scalars['PageID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbDeleteQaArgs = {
  qa_id: Scalars['String']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbIndexingDocumentTaskConfirmArgs = {
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
  version: Scalars['Int']['input'];
};


export type MutationKdbIndexingDocumentTaskCreateArgs = {
  input: KdbIndexingDocumentTaskCreateInput;
  session: Scalars['Session']['input'];
};


export type MutationKdbIndexingDocumentTaskDeleteArgs = {
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
};


export type MutationKdbIndexingDocumentTaskErrorArgs = {
  error: Scalars['String']['input'];
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
  version: Scalars['Int']['input'];
};


export type MutationKdbIndexingDocumentTaskPauseArgs = {
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
  version: Scalars['Int']['input'];
};


export type MutationKdbIndexingDocumentTaskTransitionStateArgs = {
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
  toState: IndexingDocumentTaskState;
  version: Scalars['Int']['input'];
};


export type MutationKdbIndexingDocumentTaskUpdateConfigArgs = {
  input: KdbIndexingDocumentTaskUpdateConfigInput;
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
  version: Scalars['Int']['input'];
};


export type MutationKdbRemoveDocumentArgs = {
  document_id: Scalars['DocumentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbUpdateAgentCollectionArgs = {
  collection_id: Scalars['CollectionID']['input'];
  input: UpdateAgentCollectionInput;
  session: Scalars['Session']['input'];
};


export type MutationKdbUpdateDocumentArgs = {
  doc: UpdateDocumentMetaInput;
  document_id: Scalars['DocumentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbUpdatePageArgs = {
  page: PageUpdate;
  page_id: Scalars['PageID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationKdbUpdateQaArgs = {
  qa: QaInput;
  qa_id: Scalars['String']['input'];
  session: Scalars['Session']['input'];
};


export type MutationParticipantPublishToMarketplaceArgs = {
  chat_id: Scalars['ChatID']['input'];
  participant_id: Scalars['ParticipantID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationRegenerateLastResponseArgs = {
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationRemoveAgentFromChatArgs = {
  agent_id: Scalars['AgentID']['input'];
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationRemoveAgentTelegramIntegrationArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationRenameChatRoomArgs = {
  id: Scalars['ChatID']['input'];
  new_name: Scalars['String']['input'];
  session: Scalars['Session']['input'];
};


export type MutationReplaceSecretArgs = {
  params: ReplaceSecretParams;
  session: Scalars['Session']['input'];
};


export type MutationSendMessageArgs = {
  chat_id: Scalars['ChatID']['input'];
  message: MessageInput;
  session: Scalars['Session']['input'];
};


export type MutationSetMessageMetaArgs = {
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  message_meta: MessageMetaInput;
  session: Scalars['Session']['input'];
};


export type MutationSetVariableArgs = {
  key: Scalars['String']['input'];
  namespace: NamespaceInput;
  session: Scalars['Session']['input'];
  value: VariableValueInput;
};


export type MutationSetVariablesArgs = {
  namespace: NamespaceInput;
  session: Scalars['Session']['input'];
  variables: Array<KeyValueInput>;
};


export type MutationStopCompletionArgs = {
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type MutationUnsubscribeBalanceArgs = {
  session: Scalars['Session']['input'];
  sub_id: Scalars['BalanceSubscriptionID']['input'];
};


export type MutationUnsubscribeChatRoomArgs = {
  session: Scalars['Session']['input'];
  sub_id: Scalars['SubscriptionID']['input'];
};


export type MutationUnsubscribeMessagesArgs = {
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
  sub_id: Scalars['SubscriptionID']['input'];
};


export type MutationUpdateAgentArgs = {
  agent_id: Scalars['AgentID']['input'];
  input: UpdateAgentInput;
  session: Scalars['Session']['input'];
};


export type MutationUploadAttachmentArgs = {
  attachment: AttachmentBlob;
  session: Scalars['Session']['input'];
};


export type MutationUserSetEmailArgs = {
  email: Scalars['Email']['input'];
  session: Scalars['Session']['input'];
};


export type MutationVoiceToTextArgs = {
  attachment_id: Scalars['AttachmentID']['input'];
  session: Scalars['Session']['input'];
};

export type MyXAccount = {
  __typename?: 'MyXAccount';
  notifications: MyXAccountNotifications;
  twitter_account: TwitterAccount;
  x_api_keys_hint: XApiKeys;
};

export type MyXAccountNotifications = {
  __typename?: 'MyXAccountNotifications';
  enable_mention_notifications: Scalars['Boolean']['output'];
  enable_post_notifications: Scalars['Boolean']['output'];
  enable_reply_notifications: Scalars['Boolean']['output'];
};

export type MyXAccountNotificationsInput = {
  enable_mention_notifications: Scalars['Boolean']['input'];
  enable_post_notifications: Scalars['Boolean']['input'];
  enable_reply_notifications: Scalars['Boolean']['input'];
};

export type NamespaceInput = {
  agentID?: InputMaybe<Scalars['ID']['input']>;
  chatID?: InputMaybe<Scalars['ID']['input']>;
  executionID?: InputMaybe<Scalars['ID']['input']>;
  type: NamespaceType;
};

export enum NamespaceType {
  Agent = 'agent',
  Chat = 'chat',
  ChatAgent = 'chat_agent',
  Execution = 'execution'
}

export type OAuthLoginInput = {
  code: Scalars['String']['input'];
  code_verifier: Scalars['String']['input'];
};

export type OAuthRedirectUrlResult = {
  __typename?: 'OAuthRedirectURLResult';
  code_verifier: Scalars['String']['output'];
  redirect_url: Scalars['String']['output'];
};

export enum OrderByField {
  ChunkNumber = 'ChunkNumber',
  PublishedDate = 'PublishedDate',
  Similarity = 'Similarity'
}

export enum OrderDirection {
  Asc = 'Asc',
  Desc = 'Desc'
}

export type Page = {
  __typename?: 'Page';
  content: Scalars['String']['output'];
  created_at: Scalars['Time']['output'];
  description?: Maybe<Scalars['String']['output']>;
  document_id: Scalars['DocumentID']['output'];
  indexing_state: IndexingState;
  number: Scalars['Int']['output'];
  page_id: Scalars['PageID']['output'];
  task_id: Scalars['TaskID']['output'];
};

export type PageInput = {
  content: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  document_id: Scalars['DocumentID']['input'];
  number: Scalars['Int']['input'];
  task_id: Scalars['TaskID']['input'];
};

export type PageUpdate = {
  content: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
};

export type PairPrice = {
  __typename?: 'PairPrice';
  base_currency: Scalars['String']['output'];
  change_24h: Scalars['Float']['output'];
  high: Scalars['Float']['output'];
  low: Scalars['Float']['output'];
  month: Scalars['Float']['output'];
  open: Scalars['Float']['output'];
  price: Scalars['Float']['output'];
  quote_currency: Scalars['String']['output'];
  time: Scalars['Time']['output'];
  week: Scalars['Float']['output'];
};

export type Participant = {
  __typename?: 'Participant';
  agent_id: Scalars['AgentID']['output'];
  avatar: Scalars['String']['output'];
  first_name: Scalars['String']['output'];
  is_agent: Scalars['Boolean']['output'];
  last_name?: Maybe<Scalars['String']['output']>;
  llm_model: Scalars['String']['output'];
  meta: Scalars['JSON']['output'];
  participant_id: Scalars['ParticipantID']['output'];
  purpose?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  self_awareness?: Maybe<Scalars['String']['output']>;
  tools: Array<Tool>;
  username: Scalars['String']['output'];
};

export type ParticipantInput = {
  avatar: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  last_name?: InputMaybe<Scalars['String']['input']>;
  llm_model: Scalars['String']['input'];
  purpose: Scalars['String']['input'];
  role: Scalars['String']['input'];
  self_awareness: Scalars['String']['input'];
  tools: Array<Scalars['String']['input']>;
  username: Scalars['Username']['input'];
};

export type PartnerAgentMeta = {
  __typename?: 'PartnerAgentMeta';
  avatar: Scalars['String']['output'];
  name: Scalars['String']['output'];
  role: Scalars['String']['output'];
  social: AgentSocial;
  token_address?: Maybe<Scalars['String']['output']>;
  token_metrics?: Maybe<AgentTokenMetrics>;
  url: Scalars['String']['output'];
};

export enum Period {
  D1 = 'D1',
  H1 = 'H1'
}

export enum ProviderId {
  Google = 'google',
  Metamask = 'metamask',
  Telegram = 'telegram',
  Twitter = 'twitter'
}

export type Qa = {
  __typename?: 'QA';
  answer: Scalars['String']['output'];
  answer_tokens: Scalars['Int']['output'];
  chunk_id: Scalars['ChunkID']['output'];
  chunk_number: Scalars['Int']['output'];
  created_at: Scalars['Time']['output'];
  document_id: Scalars['DocumentID']['output'];
  document_published_at: Scalars['Time']['output'];
  indexing_state: IndexingState;
  model?: Maybe<Scalars['String']['output']>;
  page_number_from: Scalars['Int']['output'];
  page_number_to: Scalars['Int']['output'];
  qa_id: Scalars['String']['output'];
  question: Scalars['String']['output'];
  question_tokens: Scalars['Int']['output'];
  task_id: Scalars['TaskID']['output'];
};

export type QaInput = {
  answer: Scalars['String']['input'];
  question: Scalars['String']['input'];
};

export type QaWithDistance = {
  __typename?: 'QAWithDistance';
  distance: Scalars['Float']['output'];
  qa: Qa;
};

export type QaWithDocuments = {
  __typename?: 'QAWithDocuments';
  document: DocumentMeta;
  qas: Array<QaWithDistance>;
};

export type QaWithSimilarity = {
  __typename?: 'QAWithSimilarity';
  qa: Qa;
  similarity: Scalars['Float']['output'];
};

export type QaWithSimilarityByDocuments = {
  __typename?: 'QAWithSimilarityByDocuments';
  document: DocumentMeta;
  qas: Array<QaWithSimilarity>;
};

export type Query = {
  __typename?: 'Query';
  CurrentPrice: CurrentPriceResponse;
  HistoricalPrice?: Maybe<Array<HistoricalPriceResponse>>;
  _service: _Service;
  adminAgentGetTwitterApiKeys: XApiKeys;
  adminGetParticipantTelegramBotApiKey: Scalars['String']['output'];
  agentCheckUsernameExists: Scalars['Boolean']['output'];
  agentGetAttachedTwitterAccounts: Array<TwitterAccount>;
  agentGetMyXAccount: MyXAccount;
  authGoogleRedirectURL: OAuthRedirectUrlResult;
  authMetamaskMessage: Scalars['MetamaskMessage']['output'];
  authSessionAlive: Scalars['Boolean']['output'];
  authTelegramBotID: Scalars['TelegramBotID']['output'];
  authTwitterRedirectURL: OAuthRedirectUrlResult;
  chainGraphGet?: Maybe<ChainGraph>;
  chainGraphGetByID?: Maybe<ChainGraph>;
  chainGraphHistory: Array<ChainGraphHistory>;
  chatRoomGetParticipant: Participant;
  chatRoomGetParticipants: Array<Participant>;
  ctGetReferences: Array<CtPostReference>;
  getChatRoom: ChatRoom;
  getChatRooms: Array<ChatRoom>;
  getLLMUsages: Array<LlmUsage>;
  getTelegramBotInfo: TelegramBot;
  getTweetsFromDB: Array<Tweet>;
  getVariable: VariableResponse;
  getVariables: VariablesResponse;
  kdbGetAgentCollections: Array<Collection>;
  kdbGetAgentCollectionsWithDocuments: Array<CollectionWithDocuments>;
  kdbGetChunk: Chunk;
  kdbGetChunksByDocument: Array<Chunk>;
  kdbGetChunksByTask: Array<Chunk>;
  kdbGetCollection: Collection;
  /** @deprecated Use kdbGetCollectionsByIds instead */
  kdbGetCollections: Array<Collection>;
  kdbGetCollectionsByIds: Array<Collection>;
  /** @deprecated just old */
  kdbGetDefaultParticipantCollection: Collection;
  kdbGetDocuments: Array<DocumentMeta>;
  kdbGetDocumentsByCollection: Array<DocumentWithPagesCount>;
  kdbGetPagesByDocument: Array<Page>;
  kdbGetPagesByTask: Array<Page>;
  /** @deprecated just old */
  kdbGetParticipantCollections: Array<Collection>;
  kdbGetQAByCollection: Array<Qa>;
  kdbGetQAByDocument: Array<Qa>;
  kdbGetQAByTask: Array<Qa>;
  kdbIndexingDocumentTaskGet: IndexingDocumentTask;
  kdbIndexingDocumentTaskGetByDocument: Array<IndexingDocumentTask>;
  kdbIndexingDocumentTaskGetByState: Array<IndexingDocumentTask>;
  kdbIndexingDocumentTasksGet: Array<IndexingDocumentTask>;
  /** @deprecated use kdbSearchQAWithDocuments */
  kdbQueryCollectionQA: Array<QaWithDistance>;
  /** @deprecated use kdbSearchQAWithDocuments */
  kdbQueryCollectionQAWithDocuments: Array<QaWithDocuments>;
  /** @deprecated use kdbSearchQAWithDocuments */
  kdbQueryParticipantCollectionQA: Array<QaWithDistance>;
  kdbSearchQAWithDocuments: Array<QaWithSimilarityByDocuments>;
  marketplaceAgent: AgentMeta;
  marketplaceAgents: Array<AgentCollection>;
  marketplaceAgentsByIDs: Array<AgentMeta>;
  message?: Maybe<Message>;
  messages: Array<Message>;
  messagesWithoutSystem: Array<Message>;
  partnerAgents: Array<PartnerAgentMeta>;
  /** Retrieve a secret by ID. */
  secret: SecretResponse;
  /** List of the secrets owned by the user. */
  secrets: SecretsResponse;
  /** Aggregated data of the staking contract. */
  staking: StakingResponse;
  /** Tier of the staker. */
  stakingTier: StakingTierResponse;
  userProfile: UserProfile;
};


export type QueryCurrentPriceArgs = {
  request: CurrentPriceRequest;
};


export type QueryHistoricalPriceArgs = {
  request: HistoricalPriceRequest;
};


export type QueryAdminAgentGetTwitterApiKeysArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryAdminGetParticipantTelegramBotApiKeyArgs = {
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryAgentCheckUsernameExistsArgs = {
  session: Scalars['Session']['input'];
  username: Scalars['Username']['input'];
};


export type QueryAgentGetAttachedTwitterAccountsArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryAgentGetMyXAccountArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryAuthMetamaskMessageArgs = {
  address: Scalars['MetamaskAddress']['input'];
};


export type QueryAuthSessionAliveArgs = {
  session: Scalars['Session']['input'];
};


export type QueryChainGraphGetArgs = {
  chat_id: Scalars['ChatID']['input'];
  participant_id: Scalars['ParticipantID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryChainGraphGetByIdArgs = {
  graph_id: Scalars['GraphID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryChainGraphHistoryArgs = {
  graph_id: Scalars['GraphID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryChatRoomGetParticipantArgs = {
  chat_id: Scalars['ChatID']['input'];
  participant_id: Scalars['ParticipantID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryChatRoomGetParticipantsArgs = {
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryCtGetReferencesArgs = {
  document_urls: Array<Scalars['String']['input']>;
  session: Scalars['Session']['input'];
};


export type QueryGetChatRoomArgs = {
  chat_id: Scalars['ChatID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryGetChatRoomsArgs = {
  session: Scalars['Session']['input'];
};


export type QueryGetLlmUsagesArgs = {
  chat_id: Scalars['ChatID']['input'];
  message_id: Scalars['MessageID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryGetTelegramBotInfoArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryGetTweetsFromDbArgs = {
  session: Scalars['Session']['input'];
  tweets_ids: Array<Scalars['TweetID']['input']>;
};


export type QueryGetVariableArgs = {
  key: Scalars['String']['input'];
  namespace: NamespaceInput;
  session: Scalars['Session']['input'];
};


export type QueryGetVariablesArgs = {
  namespace: NamespaceInput;
  session: Scalars['Session']['input'];
};


export type QueryKdbGetAgentCollectionsArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetAgentCollectionsWithDocumentsArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetChunkArgs = {
  chunk_id: Scalars['ChunkID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetChunksByDocumentArgs = {
  document_id: Scalars['DocumentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetChunksByTaskArgs = {
  session: Scalars['Session']['input'];
  task_id: Scalars['TaskID']['input'];
};


export type QueryKdbGetCollectionArgs = {
  collection_id: Scalars['CollectionID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetCollectionsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetCollectionsByIdsArgs = {
  collection_id: Array<Scalars['CollectionID']['input']>;
  session: Scalars['Session']['input'];
};


export type QueryKdbGetDefaultParticipantCollectionArgs = {
  participant_id: Scalars['ParticipantID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetDocumentsArgs = {
  document_ids: Array<Scalars['DocumentID']['input']>;
  session: Scalars['Session']['input'];
};


export type QueryKdbGetDocumentsByCollectionArgs = {
  collection_id: Scalars['CollectionID']['input'];
  filters?: GetDocumentsByCollectionFilters;
  limit?: Scalars['Int']['input'];
  order_by?: GetDocumentsByCollectionOrderByInput;
  session: Scalars['Session']['input'];
};


export type QueryKdbGetPagesByDocumentArgs = {
  document_id: Scalars['DocumentID']['input'];
  filters?: GetPagesByDocumentFilters;
  session: Scalars['Session']['input'];
};


export type QueryKdbGetPagesByTaskArgs = {
  session: Scalars['Session']['input'];
  task_id: Scalars['TaskID']['input'];
};


export type QueryKdbGetParticipantCollectionsArgs = {
  participant_id: Scalars['ParticipantID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetQaByCollectionArgs = {
  chunk_from: Scalars['Int']['input'];
  chunk_to: Scalars['Int']['input'];
  collection_id: Scalars['CollectionID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetQaByDocumentArgs = {
  chunk_from: Scalars['Int']['input'];
  chunk_to: Scalars['Int']['input'];
  document_id: Scalars['DocumentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryKdbGetQaByTaskArgs = {
  chunk_from: Scalars['Int']['input'];
  chunk_to: Scalars['Int']['input'];
  session: Scalars['Session']['input'];
  task_id: Scalars['TaskID']['input'];
};


export type QueryKdbIndexingDocumentTaskGetArgs = {
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
};


export type QueryKdbIndexingDocumentTaskGetByDocumentArgs = {
  document_id: Array<Scalars['DocumentID']['input']>;
  session: Scalars['Session']['input'];
};


export type QueryKdbIndexingDocumentTaskGetByStateArgs = {
  limit?: Scalars['Int']['input'];
  session: Scalars['Session']['input'];
  state: Array<IndexingDocumentTaskState>;
};


export type QueryKdbIndexingDocumentTasksGetArgs = {
  session: Scalars['Session']['input'];
  taskID: Array<Scalars['TaskID']['input']>;
};


export type QueryKdbQueryCollectionQaArgs = {
  collection_id?: InputMaybe<Array<Scalars['CollectionID']['input']>>;
  limit?: Scalars['Int']['input'];
  queryString: Scalars['String']['input'];
  session: Scalars['Session']['input'];
  threshold?: Scalars['Float']['input'];
  tokensLimit?: Scalars['Int']['input'];
};


export type QueryKdbQueryCollectionQaWithDocumentsArgs = {
  collection_id?: InputMaybe<Array<Scalars['CollectionID']['input']>>;
  limit?: Scalars['Int']['input'];
  queryString: Scalars['String']['input'];
  session: Scalars['Session']['input'];
  threshold?: Scalars['Float']['input'];
  tokensLimit?: Scalars['Int']['input'];
};


export type QueryKdbQueryParticipantCollectionQaArgs = {
  limit?: Scalars['Int']['input'];
  participantID: Scalars['ParticipantID']['input'];
  queryString: Scalars['String']['input'];
  session: Scalars['Session']['input'];
  threshold?: Scalars['Float']['input'];
  tokensLimit?: Scalars['Int']['input'];
};


export type QueryKdbSearchQaWithDocumentsArgs = {
  collections: Array<Scalars['CollectionID']['input']>;
  filters?: InputMaybe<SearchQaFilters>;
  options?: InputMaybe<SearchQaOptions>;
  order_by?: InputMaybe<SearchQaOrderBy>;
  queries: Array<Scalars['String']['input']>;
  queries_weights?: InputMaybe<Array<Scalars['Float']['input']>>;
  session: Scalars['Session']['input'];
};


export type QueryMarketplaceAgentArgs = {
  agent_id: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryMarketplaceAgentsArgs = {
  session: Scalars['Session']['input'];
};


export type QueryMarketplaceAgentsByIDsArgs = {
  agent_ids: Array<Scalars['AgentID']['input']>;
  session: Scalars['Session']['input'];
};


export type QueryMessageArgs = {
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  session: Scalars['Session']['input'];
};


export type QueryMessagesArgs = {
  chat_id: Scalars['ChatID']['input'];
  from: Scalars['MessageID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  session: Scalars['Session']['input'];
};


export type QueryMessagesWithoutSystemArgs = {
  chat_id: Scalars['ChatID']['input'];
  from: Scalars['MessageID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  session: Scalars['Session']['input'];
};


export type QueryPartnerAgentsArgs = {
  partner_id: Scalars['PartnerID']['input'];
};


export type QuerySecretArgs = {
  id: Scalars['SecretID']['input'];
  publicKey: Scalars['ECDHPublicKeyP256']['input'];
  session: Scalars['Session']['input'];
};


export type QuerySecretsArgs = {
  session: Scalars['Session']['input'];
};


export type QueryStakingTierArgs = {
  session: Scalars['Session']['input'];
};


export type QueryUserProfileArgs = {
  session: Scalars['Session']['input'];
};

/** Parameters of the replaceSecret mutation. */
export type ReplaceSecretParams = {
  /** ID of the secret to be replaced. */
  id: Scalars['SecretID']['input'];
  /** Type of the secret. */
  type: Scalars['String']['input'];
  /** Unencrypted secret value. */
  value: Scalars['JSON']['input'];
};

/** Response to the replaceSecret mutation. */
export type ReplaceSecretResponse = {
  __typename?: 'ReplaceSecretResponse';
  /** ID of the new secret. */
  id: Scalars['SecretID']['output'];
};

export type SearchQaFilterPublishedRange = {
  from?: InputMaybe<Scalars['Time']['input']>;
  to?: InputMaybe<Scalars['Time']['input']>;
};

export type SearchQaFilters = {
  doc_ids?: InputMaybe<Array<Scalars['DocumentID']['input']>>;
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  published_range?: InputMaybe<SearchQaFilterPublishedRange>;
};

export type SearchQaOptions = {
  qa_count?: InputMaybe<Scalars['Int']['input']>;
  threshold?: InputMaybe<Scalars['Float']['input']>;
  time_weight_decay?: InputMaybe<TimeWeightDecay>;
  tokens_limit?: InputMaybe<Scalars['Int']['input']>;
};

export type SearchQaOrderBy = {
  document_direction?: InputMaybe<OrderDirection>;
  document_field?: InputMaybe<OrderByField>;
  qa_direction?: InputMaybe<OrderDirection>;
  qa_field?: InputMaybe<OrderByField>;
};

/** A typed encrypted value that only belongs to its owner. */
export type Secret = {
  __typename?: 'Secret';
  /** Encrypted value of the secret. */
  encrypted: Scalars['BlobBase64']['output'];
  /** Metadata describing the encrypted value. */
  metadata: SecretMetadata;
};

/** Unencrypted data which describes a secret. */
export type SecretMetadata = {
  __typename?: 'SecretMetadata';
  /** ID of the secret. */
  id: Scalars['SecretID']['output'];
  /** Name of the secret. */
  name: Scalars['String']['output'];
  /** Type of the secret. */
  type: Scalars['String']['output'];
  /** Owner of the secret. */
  userID: Scalars['UserID']['output'];
};

/** Response to the secret query. */
export type SecretResponse = {
  __typename?: 'SecretResponse';
  /** Ephemeral public key of secp256r1 curve for Diffie-Hellman algorithm to get decryption key of AES-256 in GCM mode. */
  publicKey: Scalars['ECDHPublicKeyP256']['output'];
  /** The secret with the given ID. */
  secret: Secret;
};

/** Response to the secrets query. */
export type SecretsResponse = {
  __typename?: 'SecretsResponse';
  /** List of the secrets owned by the user. */
  secrets: Array<SecretMetadata>;
};

export type Signal = {
  message_id?: Maybe<Scalars['MessageID']['output']>;
};

export type SignalInput = {
  agent_id: Scalars['AgentID']['input'];
  message_id?: InputMaybe<Scalars['MessageID']['input']>;
};

/** Response to the staking query. */
export type StakingResponse = {
  __typename?: 'StakingResponse';
  /** Annual Percentage Yield (APY) is the ratio between early income and money spent in dollar equivalent. */
  apy: Scalars['Float']['output'];
  /** Price of the reward token in USD. */
  rewardTokenPriceUSD: Scalars['Decimal']['output'];
  /** Amount of reward tokens distributed between all stakers per second in current epoch. */
  rewardTokensPerSecond: Scalars['Decimal']['output'];
  /** Price of the staking token in USD. */
  stakingTokenPriceUSD: Scalars['Decimal']['output'];
  /** List of the available tiers. */
  tiers: Array<Tier>;
  /** Amount of unique addresses that are currently have a positive stake. */
  uniqueStakersCount: Scalars['Int']['output'];
};

/** Response to the stakingTier query. */
export type StakingTierResponse = {
  __typename?: 'StakingTierResponse';
  /** Tier of the staker. null means that the staker has no tier */
  Tier?: Maybe<Tier>;
};

export type Subscription = {
  __typename?: 'Subscription';
  subscribeBalance: BalanceUpdate;
  subscribeChatRooms: ChatRoomEvent;
  subscribeMessages: MessageEvent;
};


export type SubscriptionSubscribeBalanceArgs = {
  session: Scalars['Session']['input'];
};


export type SubscriptionSubscribeChatRoomsArgs = {
  limit_chats?: InputMaybe<Scalars['Int']['input']>;
  session: Scalars['Session']['input'];
};


export type SubscriptionSubscribeMessagesArgs = {
  chat_id: Scalars['ChatID']['input'];
  limitMessages?: Scalars['Int']['input'];
  session: Scalars['Session']['input'];
};

export type TelegramBot = {
  __typename?: 'TelegramBot';
  attached_chats: Array<TelegramBotChat>;
  auto_response: Scalars['Boolean']['output'];
  bot_id: Scalars['Int']['output'];
  first_name: Scalars['String']['output'];
  has_bot_token: Scalars['Boolean']['output'];
  last_name: Scalars['String']['output'];
  photo_url: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type TelegramBotChat = {
  __typename?: 'TelegramBotChat';
  chat_room_id: Scalars['ChatID']['output'];
  telegram_chat_id: Scalars['Int']['output'];
  telegram_chat_photo: Scalars['String']['output'];
  telegram_chat_title: Scalars['String']['output'];
  telegram_chat_username: Scalars['String']['output'];
};

export type TelegramChatRoomConfigInput = {
  avatar: Scalars['String']['input'];
  bot_id: Scalars['Int']['input'];
  chat_username: Scalars['String']['input'];
  owner_user_id: Scalars['UserID']['input'];
  telegram_chat_id: Scalars['Int']['input'];
  title: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type TelegramConfigInput = {
  auto_response: Scalars['Boolean']['input'];
  bot_token: Scalars['String']['input'];
  max_chats?: InputMaybe<Scalars['Int']['input']>;
  max_replies_per_day?: InputMaybe<Scalars['Int']['input']>;
};

export type TelegramLoginInput = {
  auth_date: Scalars['String']['input'];
  first_name?: InputMaybe<Scalars['String']['input']>;
  hash: Scalars['String']['input'];
  id: Scalars['String']['input'];
  last_name?: InputMaybe<Scalars['String']['input']>;
  photo_url?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type TelegramMessageInput = {
  chat_owner_user_id: Scalars['UserID']['input'];
  date: Scalars['Int']['input'];
  from: TelegramParticipantInput;
  reply_to_telegram_message_id?: InputMaybe<Scalars['Int']['input']>;
  telegram_bot_id: Scalars['Int']['input'];
  telegram_chat_id: Scalars['Int']['input'];
  telegram_chat_type: Scalars['String']['input'];
  telegram_message_id: Scalars['Int']['input'];
  text: Scalars['String']['input'];
};

export type TelegramParticipantInput = {
  avatar: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  language_code: Scalars['String']['input'];
  last_name?: InputMaybe<Scalars['String']['input']>;
  telegram_id: Scalars['Int']['input'];
  username: Scalars['String']['input'];
};

/** Category of a staker based on their staking amount. */
export type Tier = {
  __typename?: 'Tier';
  /** A multiplier of how much of the available IDO token allocation is allowed to buy. */
  AllocationWeight: Scalars['Float']['output'];
  /** Duration before a staker can participate in a next launch. */
  CoolOff: Scalars['Duration']['output'];
  /** Minimum amount of tokens that need to be staked for obtaining this tier. */
  MinimumStake: Scalars['Decimal']['output'];
  /** A display name of the tier. */
  Name: Scalars['String']['output'];
  /** The more tickets a staker has, the higher their chance to get into an earlier wave. 0 means guaranteed 1st wave. */
  NumberOfTickets: Scalars['Int']['output'];
};

export type TimeWeightDecay = {
  alpha?: InputMaybe<Scalars['Float']['input']>;
  enabled: Scalars['Boolean']['input'];
  formula: TimeWeightDecayFormula;
  polynomial_degree?: InputMaybe<Scalars['Int']['input']>;
};

export enum TimeWeightDecayFormula {
  Exponential = 'Exponential',
  Linear = 'Linear',
  Logarithmic = 'Logarithmic',
  Polynomial = 'Polynomial'
}

export type Tool = {
  __typename?: 'Tool';
  name: Scalars['String']['output'];
};

export type Triplet = {
  __typename?: 'Triplet';
  chunk_id: Scalars['ChunkID']['output'];
  created_at: Scalars['Time']['output'];
  document_id: Scalars['DocumentID']['output'];
  indexing_state: IndexingState;
  object: Scalars['String']['output'];
  predicate: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  task_id: Scalars['TaskID']['output'];
  triplet_id: Scalars['String']['output'];
};

export type TripletInput = {
  object: Scalars['String']['input'];
  predicate: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

export type Tweet = {
  __typename?: 'Tweet';
  author: TwitterUser;
  conversation_id?: Maybe<Scalars['TweetID']['output']>;
  created_at: Scalars['Time']['output'];
  in_reply_to_user_id?: Maybe<Scalars['TwitterUserID']['output']>;
  mentioned_users?: Maybe<Array<TwitterUser>>;
  public_metrics?: Maybe<TweetPublicMetrics>;
  quoted_tweet?: Maybe<Tweet>;
  reply_to_tweet_id?: Maybe<Scalars['TweetID']['output']>;
  reply_tweet?: Maybe<Tweet>;
  text: Scalars['String']['output'];
  tweet_id: Scalars['TweetID']['output'];
};

export type TweetPublicMetrics = {
  __typename?: 'TweetPublicMetrics';
  like_count?: Maybe<Scalars['Int']['output']>;
  quote_count?: Maybe<Scalars['Int']['output']>;
  reply_count?: Maybe<Scalars['Int']['output']>;
  retweet_count?: Maybe<Scalars['Int']['output']>;
};

export type TwitterAccount = {
  __typename?: 'TwitterAccount';
  created_at: Scalars['Time']['output'];
  deleted_at?: Maybe<Scalars['Time']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  followers_count?: Maybe<Scalars['Int']['output']>;
  following_count?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  initial_sync_hours?: Maybe<Scalars['Int']['output']>;
  last_synced_at?: Maybe<Scalars['Time']['output']>;
  listed_count?: Maybe<Scalars['Int']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  most_recent_tweet_id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  owner_user_id: Scalars['UserID']['output'];
  profile_image?: Maybe<Scalars['String']['output']>;
  protected?: Maybe<Scalars['Boolean']['output']>;
  sync_error?: Maybe<Scalars['String']['output']>;
  sync_status: TwitterSyncStatus;
  tweet_count?: Maybe<Scalars['Int']['output']>;
  twitter_created_at?: Maybe<Scalars['Time']['output']>;
  twitter_user_id?: Maybe<Scalars['String']['output']>;
  updated_at: Scalars['Time']['output'];
  url?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
  verified?: Maybe<Scalars['Boolean']['output']>;
};

export type TwitterMessageInput = {
  message_data: Scalars['JSON']['input'];
};

export enum TwitterSyncStatus {
  Completed = 'completed',
  Failed = 'failed',
  Pending = 'pending',
  Syncing = 'syncing'
}

export type TwitterUser = {
  __typename?: 'TwitterUser';
  created_at?: Maybe<Scalars['Time']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  profile_image_url?: Maybe<Scalars['String']['output']>;
  public_metrics?: Maybe<TwitterUserPublicMetrics>;
  url?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
};

export type TwitterUserPublicMetrics = {
  __typename?: 'TwitterUserPublicMetrics';
  followers_count?: Maybe<Scalars['Int']['output']>;
  following_count?: Maybe<Scalars['Int']['output']>;
  listed_count?: Maybe<Scalars['Int']['output']>;
  tweet_count?: Maybe<Scalars['Int']['output']>;
};

export type UpdateAgentCollectionInput = {
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type UpdateAgentInput = {
  avatar: Scalars['String']['input'];
  chain_graph_id: Scalars['GraphID']['input'];
  chat_history_config: ChatHistoryConfigInput;
  first_name: Scalars['String']['input'];
  last_name: Scalars['String']['input'];
  llm_config: LlmConfigInput;
  prompt: Scalars['String']['input'];
  role: Scalars['String']['input'];
  skeleton: Scalars['String']['input'];
  social?: InputMaybe<AgentSocialInput>;
  template_params: Scalars['JSON']['input'];
  token_address?: InputMaybe<Scalars['String']['input']>;
  username: Scalars['Username']['input'];
};

export type UpdateDocumentMetaInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  metadata: Array<DocumentMetadataKvInput>;
  name?: InputMaybe<Scalars['String']['input']>;
  published_at?: InputMaybe<Scalars['Time']['input']>;
  tags: Array<Scalars['String']['input']>;
};

export type UsageInput = {
  agent_id: Scalars['AgentID']['input'];
  chat_id: Scalars['ChatID']['input'];
  completion_cost: Scalars['Float']['input'];
  completion_tokens: Scalars['Int']['input'];
  duration: Scalars['Float']['input'];
  message_id: Scalars['Int']['input'];
  model_name: Scalars['String']['input'];
  parent_run_id: Scalars['String']['input'];
  participant_id: Scalars['ParticipantID']['input'];
  prompt: Scalars['String']['input'];
  prompt_cost: Scalars['Float']['input'];
  prompt_tokens: Scalars['Int']['input'];
  response: Scalars['String']['input'];
  run_id: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type UserProfile = {
  __typename?: 'UserProfile';
  email: Scalars['Email']['output'];
  externalAccounts: Array<ExternalAccount>;
  id: Scalars['UserID']['output'];
  name: Scalars['String']['output'];
  picture: Scalars['String']['output'];
  role: UserRole;
  tariffCurrent: UserTariff;
  tariffExpires?: Maybe<Scalars['Time']['output']>;
};

export enum UserRole {
  Admin = 'admin',
  Agent = 'agent',
  User = 'user',
  Waitlist = 'waitlist'
}

export enum UserTariff {
  Free = 'free',
  Unlimited = 'unlimited'
}

export type Variable = {
  __typename?: 'Variable';
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  namespace: Scalars['String']['output'];
  updatedAt: Scalars['Time']['output'];
  value: VariableValue;
};

export type VariableResponse = {
  __typename?: 'VariableResponse';
  variable?: Maybe<Variable>;
};

export enum VariableType {
  Any = 'any',
  Array = 'array',
  Boolean = 'boolean',
  Number = 'number',
  Object = 'object',
  String = 'string'
}

export type VariableValue = {
  __typename?: 'VariableValue';
  type: VariableType;
  value: Scalars['String']['output'];
};

export type VariableValueInput = {
  type: VariableType;
  value: Scalars['String']['input'];
};

export type VariablesResponse = {
  __typename?: 'VariablesResponse';
  variables?: Maybe<Array<Variable>>;
};

export type XApiKeys = {
  __typename?: 'XApiKeys';
  access_token: Scalars['String']['output'];
  access_token_secret: Scalars['String']['output'];
  consumer_key: Scalars['String']['output'];
  consumer_secret: Scalars['String']['output'];
};

export type XApiKeysInput = {
  access_token: Scalars['String']['input'];
  access_token_secret: Scalars['String']['input'];
  consumer_key: Scalars['String']['input'];
  consumer_secret: Scalars['String']['input'];
};

export type _Service = {
  __typename?: '_Service';
  sdl?: Maybe<Scalars['String']['output']>;
};

export type AdminAgentGetTwitterApiKeysQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  agent_id: Scalars['AgentID']['input'];
}>;


export type AdminAgentGetTwitterApiKeysQuery = { __typename?: 'Query', adminAgentGetTwitterApiKeys: { __typename?: 'XApiKeys', access_token: string, access_token_secret: string, consumer_key: string, consumer_secret: string } };

export type AdminGetParticipantTelegramBotApiKeyQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
}>;


export type AdminGetParticipantTelegramBotApiKeyQuery = { __typename?: 'Query', adminGetParticipantTelegramBotApiKey: string };

export type ChainGraphGetQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  participant_id: Scalars['ParticipantID']['input'];
}>;


export type ChainGraphGetQuery = { __typename?: 'Query', chainGraphGet?: { __typename?: 'ChainGraph', author: any, created_at: any, graph: any, graph_id: any } | null };

export type ChatRoomGetParticipantQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  participant_id: Scalars['ParticipantID']['input'];
}>;


export type ChatRoomGetParticipantQuery = { __typename?: 'Query', chatRoomGetParticipant: { __typename?: 'Participant', agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, participant_id: any, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> } };

export type ChatRoomGetParticipantsQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
}>;


export type ChatRoomGetParticipantsQuery = { __typename?: 'Query', chatRoomGetParticipants: Array<{ __typename?: 'Participant', agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, participant_id: any, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> }> };

export type GetChatRoomQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
}>;


export type GetChatRoomQuery = { __typename?: 'Query', getChatRoom: { __typename?: 'ChatRoom', id: any, name: string, author: any, created_at: any, deleted_at?: any | null, deleted: boolean, updated_at: any, last_message_time?: any | null, meta: any, last_message?: (
      { __typename?: 'Message' }
      & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
    ) | null, participants?: Array<{ __typename?: 'Participant', participant_id: any, agent_id: any, first_name: string, last_name?: string | null, username: string, avatar: string, is_agent: boolean, role?: string | null, purpose?: string | null, self_awareness?: string | null, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> }> | null } };

export type GetChatRoomsQueryVariables = Exact<{
  session: Scalars['Session']['input'];
}>;


export type GetChatRoomsQuery = { __typename?: 'Query', getChatRooms: Array<{ __typename?: 'ChatRoom', id: any, name: string, author: any, created_at: any, deleted_at?: any | null, deleted: boolean, updated_at: any, last_message_time?: any | null, meta: any, last_message?: (
      { __typename?: 'Message' }
      & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
    ) | null, participants?: Array<{ __typename?: 'Participant', participant_id: any, agent_id: any, first_name: string, last_name?: string | null, username: string, avatar: string, is_agent: boolean, role?: string | null, purpose?: string | null, self_awareness?: string | null, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> }> | null }> };

export type GetMessageQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
}>;


export type GetMessageQuery = { __typename?: 'Query', message?: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  ) | null };

export type GetMessagesQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  from: Scalars['MessageID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMessagesQuery = { __typename?: 'Query', messages: Array<(
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  )> };

export type GetMessagesWithoutSystemQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  from: Scalars['MessageID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMessagesWithoutSystemQuery = { __typename?: 'Query', messagesWithoutSystem: Array<(
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  )> };

export type AddAgentToChatMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  agent_id: Scalars['AgentID']['input'];
}>;


export type AddAgentToChatMutation = { __typename?: 'Mutation', addAgentToChat: boolean };

export type MessageAddDeltaMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  message_id: Scalars['MessageID']['input'];
  delta: Scalars['String']['input'];
}>;


export type MessageAddDeltaMutation = { __typename?: 'Mutation', addDelta: { __typename?: 'Message', id: any, chat_id: any, text: string, version: number } };

export type AddMessageAttachmentMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  attachment_id: Scalars['AttachmentID']['input'];
}>;


export type AddMessageAttachmentMutation = { __typename?: 'Mutation', addMessageAttachment: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  ) };

export type ChatRoomCreateParticipantMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  input: ParticipantInput;
}>;


export type ChatRoomCreateParticipantMutation = { __typename?: 'Mutation', chatRoomCreateParticipant: { __typename?: 'Participant', agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, participant_id: any, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> } };

export type ChatRoomUpdateParticipantMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  participant_id: Scalars['ParticipantID']['input'];
  input: ParticipantInput;
}>;


export type ChatRoomUpdateParticipantMutation = { __typename?: 'Mutation', chatRoomUpdateParticipant: { __typename?: 'Participant', agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, participant_id: any, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> } };

export type CreateChatRoomMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  agents?: InputMaybe<Array<Scalars['AgentID']['input']> | Scalars['AgentID']['input']>;
}>;


export type CreateChatRoomMutation = { __typename?: 'Mutation', createChatRoom: { __typename?: 'ChatRoom', id: any, name: string, author: any, created_at: any, deleted_at?: any | null, deleted: boolean, updated_at: any, last_message_time?: any | null, meta: any, last_message?: (
      { __typename?: 'Message' }
      & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
    ) | null, participants?: Array<{ __typename?: 'Participant', agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, participant_id: any, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> }> | null } };

export type DeleteChatRoomMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chatID: Scalars['ChatID']['input'];
}>;


export type DeleteChatRoomMutation = { __typename?: 'Mutation', deleteChatRoom: boolean };

export type DeleteMessageMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  message_id: Scalars['MessageID']['input'];
}>;


export type DeleteMessageMutation = { __typename?: 'Mutation', deleteMessage: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  ) };

export type EditMessageMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  message: MessageEditInput;
}>;


export type EditMessageMutation = { __typename?: 'Mutation', editMessage: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  ) };

export type FinishMessageMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
}>;


export type FinishMessageMutation = { __typename?: 'Mutation', finishMessage: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  ) };

export type RegenerateLastResponseMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
}>;


export type RegenerateLastResponseMutation = { __typename?: 'Mutation', regenerateLastResponse: boolean };

export type RenameChatRoomMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  id: Scalars['ChatID']['input'];
  new_name: Scalars['String']['input'];
}>;


export type RenameChatRoomMutation = { __typename?: 'Mutation', renameChatRoom: { __typename?: 'ChatRoom', id: any, name: string, author: any, created_at: any, deleted_at?: any | null, deleted: boolean, updated_at: any, last_message_time?: any | null, meta: any, last_message?: (
      { __typename?: 'Message' }
      & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
    ) | null, participants?: Array<{ __typename?: 'Participant', agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, participant_id: any, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> }> | null } };

export type SendMessageMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  message: MessageInput;
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  ) };

export type SetMessageMetaMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  id: Scalars['MessageID']['input'];
  message_meta: MessageMetaInput;
}>;


export type SetMessageMetaMutation = { __typename?: 'Mutation', setMessageMeta: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
  ) };

export type StopCompletionMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
}>;


export type StopCompletionMutation = { __typename?: 'Mutation', stopCompletion: boolean };

export type UnsubscribeMessagesMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  sub_id: Scalars['SubscriptionID']['input'];
}>;


export type UnsubscribeMessagesMutation = { __typename?: 'Mutation', unsubscribeMessages: boolean };

export type AuthMetamaskMessageQueryVariables = Exact<{
  address: Scalars['MetamaskAddress']['input'];
}>;


export type AuthMetamaskMessageQuery = { __typename?: 'Query', authMetamaskMessage: any };

export type GetTweetsFromDbQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  tweets_ids: Array<Scalars['TweetID']['input']> | Scalars['TweetID']['input'];
}>;


export type GetTweetsFromDbQuery = { __typename?: 'Query', getTweetsFromDB: Array<(
    { __typename?: 'Tweet' }
    & { ' $fragmentRefs'?: { 'TweetFieldsFragment': TweetFieldsFragment } }
  )> };

export type TwitterUserFieldsFragment = { __typename?: 'TwitterUser', created_at?: any | null, description?: string | null, id?: string | null, name?: string | null, profile_image_url?: string | null, url?: string | null, username?: string | null, verified?: boolean | null, public_metrics?: { __typename?: 'TwitterUserPublicMetrics', followers_count?: number | null, following_count?: number | null, listed_count?: number | null, tweet_count?: number | null } | null } & { ' $fragmentName'?: 'TwitterUserFieldsFragment' };

export type TweetFieldsFragment = { __typename?: 'Tweet', tweet_id: any, text: string, conversation_id?: any | null, in_reply_to_user_id?: any | null, reply_to_tweet_id?: any | null, created_at: any, author: (
    { __typename?: 'TwitterUser' }
    & { ' $fragmentRefs'?: { 'TwitterUserFieldsFragment': TwitterUserFieldsFragment } }
  ), mentioned_users?: Array<(
    { __typename?: 'TwitterUser' }
    & { ' $fragmentRefs'?: { 'TwitterUserFieldsFragment': TwitterUserFieldsFragment } }
  )> | null, public_metrics?: { __typename?: 'TweetPublicMetrics', like_count?: number | null, quote_count?: number | null, reply_count?: number | null, retweet_count?: number | null } | null, quoted_tweet?: { __typename?: 'Tweet', conversation_id?: any | null, in_reply_to_user_id?: any | null, reply_to_tweet_id?: any | null, created_at: any, text: string, tweet_id: any, author: (
      { __typename?: 'TwitterUser' }
      & { ' $fragmentRefs'?: { 'TwitterUserFieldsFragment': TwitterUserFieldsFragment } }
    ), mentioned_users?: Array<(
      { __typename?: 'TwitterUser' }
      & { ' $fragmentRefs'?: { 'TwitterUserFieldsFragment': TwitterUserFieldsFragment } }
    )> | null, public_metrics?: { __typename?: 'TweetPublicMetrics', like_count?: number | null, quote_count?: number | null, reply_count?: number | null, retweet_count?: number | null } | null, quoted_tweet?: { __typename?: 'Tweet', tweet_id: any } | null, reply_tweet?: { __typename?: 'Tweet', tweet_id: any } | null } | null, reply_tweet?: { __typename?: 'Tweet', conversation_id?: any | null, in_reply_to_user_id?: any | null, reply_to_tweet_id?: any | null, created_at: any, text: string, tweet_id: any, author: (
      { __typename?: 'TwitterUser' }
      & { ' $fragmentRefs'?: { 'TwitterUserFieldsFragment': TwitterUserFieldsFragment } }
    ), mentioned_users?: Array<(
      { __typename?: 'TwitterUser' }
      & { ' $fragmentRefs'?: { 'TwitterUserFieldsFragment': TwitterUserFieldsFragment } }
    )> | null, public_metrics?: { __typename?: 'TweetPublicMetrics', like_count?: number | null, quote_count?: number | null, reply_count?: number | null, retweet_count?: number | null } | null, quoted_tweet?: { __typename?: 'Tweet', tweet_id: any } | null, reply_tweet?: { __typename?: 'Tweet', tweet_id: any } | null } | null } & { ' $fragmentName'?: 'TweetFieldsFragment' };

export type ChunkFieldsFragment = { __typename?: 'Chunk', chunk_id: any, chunk_number: number, content: string, document_id: any, task_id: any, page_number_from: number, page_number_to: number, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } } & { ' $fragmentName'?: 'ChunkFieldsFragment' };

export type CollectionFieldsFragment = { __typename?: 'Collection', collection_id: any, agent_id: any, creator_address: string, name: string, description: string, created_at: any, tags: Array<string>, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } } & { ' $fragmentName'?: 'CollectionFieldsFragment' };

export type DocumentFieldsFragment = { __typename?: 'DocumentMeta', document_id: any, collection_id: any, url?: string | null, created_at: any, published_at: any, name?: string | null, description?: string | null, tags: Array<string>, metadata: Array<{ __typename?: 'DocumentMetadataKV', key: string, value: string }>, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } } & { ' $fragmentName'?: 'DocumentFieldsFragment' };

export type KdbGetParticipantCollectionsQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  agent_id: Scalars['AgentID']['input'];
}>;


export type KdbGetParticipantCollectionsQuery = { __typename?: 'Query', kdbGetAgentCollections: Array<(
    { __typename?: 'Collection' }
    & { ' $fragmentRefs'?: { 'CollectionFieldsFragment': CollectionFieldsFragment } }
  )> };

export type KdbGetChunkQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  chunk_id: Scalars['ChunkID']['input'];
}>;


export type KdbGetChunkQuery = { __typename?: 'Query', kdbGetChunk: (
    { __typename?: 'Chunk' }
    & { ' $fragmentRefs'?: { 'ChunkFieldsFragment': ChunkFieldsFragment } }
  ) };

export type KdbGetChunksByDocumentQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  document_id: Scalars['DocumentID']['input'];
}>;


export type KdbGetChunksByDocumentQuery = { __typename?: 'Query', kdbGetChunksByDocument: Array<(
    { __typename?: 'Chunk' }
    & { ' $fragmentRefs'?: { 'ChunkFieldsFragment': ChunkFieldsFragment } }
  )> };

export type KdbGetChunksByTaskQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  task_id: Scalars['TaskID']['input'];
}>;


export type KdbGetChunksByTaskQuery = { __typename?: 'Query', kdbGetChunksByTask: Array<(
    { __typename?: 'Chunk' }
    & { ' $fragmentRefs'?: { 'ChunkFieldsFragment': ChunkFieldsFragment } }
  )> };

export type KdbGetCollectionQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  collection_id: Scalars['CollectionID']['input'];
}>;


export type KdbGetCollectionQuery = { __typename?: 'Query', kdbGetCollection: (
    { __typename?: 'Collection' }
    & { ' $fragmentRefs'?: { 'CollectionFieldsFragment': CollectionFieldsFragment } }
  ) };

export type KdbGetDocumentsQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  document_ids: Array<Scalars['DocumentID']['input']> | Scalars['DocumentID']['input'];
}>;


export type KdbGetDocumentsQuery = { __typename?: 'Query', kdbGetDocuments: Array<(
    { __typename?: 'DocumentMeta' }
    & { ' $fragmentRefs'?: { 'DocumentFieldsFragment': DocumentFieldsFragment } }
  )> };

export type KdbGetDocumentsByCollectionQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  collection_id: Scalars['CollectionID']['input'];
  filters?: InputMaybe<GetDocumentsByCollectionFilters>;
  order_by?: InputMaybe<GetDocumentsByCollectionOrderByInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type KdbGetDocumentsByCollectionQuery = { __typename?: 'Query', kdbGetDocumentsByCollection: Array<{ __typename?: 'DocumentWithPagesCount', pagesCount: number, document: (
      { __typename?: 'DocumentMeta' }
      & { ' $fragmentRefs'?: { 'DocumentFieldsFragment': DocumentFieldsFragment } }
    ) }> };

export type KdbGetPagesByDocumentQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  document_id: Scalars['DocumentID']['input'];
}>;


export type KdbGetPagesByDocumentQuery = { __typename?: 'Query', kdbGetPagesByDocument: Array<{ __typename?: 'Page', page_id: any, content: string, description?: string | null, document_id: any, task_id: any, number: number, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } }> };

export type KdbGetPagesByTaskQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  task_id: Scalars['TaskID']['input'];
}>;


export type KdbGetPagesByTaskQuery = { __typename?: 'Query', kdbGetPagesByTask: Array<(
    { __typename?: 'Page' }
    & { ' $fragmentRefs'?: { 'PageFieldsFragment': PageFieldsFragment } }
  )> };

export type IndexingDocumentTaskFieldsFragment = { __typename?: 'IndexingDocumentTask', task_id: any, document_id: any, chat_id: any, message_id: any, author_id: any, task_state: IndexingDocumentTaskState, created_at: any, update_at: any, confirmed: boolean, version: number, error?: string | null, statistics: { __typename?: 'IndexingDocumentStatistics', chunks_indexed_qa: number, chunks_indexed_triplet: number, chunks_total: number, current_indexing_speed: number, expected_finish_seconds?: number | null, expected_finished_at?: any | null, indexed_percent: number, indexing_started_at?: any | null, llm_approximate_cost: number, pages: number, qa_total: number, total_tokens: number, triplets_total: number, indexed_for_seconds?: number | null, llm_stats: { __typename?: 'IndexingDocumentStatisticsLLM', completion_cost: number, embeddings_cost: number, embeddings_count: number, prompt_cost: number, total_cost: number } }, config: { __typename?: 'IndexingDocumentTaskConfig', chunk_overlap_tokens: number, chunk_size_tokens: number, cost_limit: number, need_qa: boolean, qa_count_per_run: number, qa_model: string, force_confirm: boolean, instruction_for_qa?: string | null } } & { ' $fragmentName'?: 'IndexingDocumentTaskFieldsFragment' };

export type KdbIndexingDocumentTaskGetQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
}>;


export type KdbIndexingDocumentTaskGetQuery = { __typename?: 'Query', kdbIndexingDocumentTaskGet: (
    { __typename?: 'IndexingDocumentTask' }
    & { ' $fragmentRefs'?: { 'IndexingDocumentTaskFieldsFragment': IndexingDocumentTaskFieldsFragment } }
  ) };

export type KdbIndexingDocumentTaskGetByDocumentQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  document_id: Array<Scalars['DocumentID']['input']> | Scalars['DocumentID']['input'];
}>;


export type KdbIndexingDocumentTaskGetByDocumentQuery = { __typename?: 'Query', kdbIndexingDocumentTaskGetByDocument: Array<(
    { __typename?: 'IndexingDocumentTask' }
    & { ' $fragmentRefs'?: { 'IndexingDocumentTaskFieldsFragment': IndexingDocumentTaskFieldsFragment } }
  )> };

export type KdbIndexingDocumentTaskGetByStateQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  state: Array<IndexingDocumentTaskState> | IndexingDocumentTaskState;
  limit?: Scalars['Int']['input'];
}>;


export type KdbIndexingDocumentTaskGetByStateQuery = { __typename?: 'Query', kdbIndexingDocumentTaskGetByState: Array<(
    { __typename?: 'IndexingDocumentTask' }
    & { ' $fragmentRefs'?: { 'IndexingDocumentTaskFieldsFragment': IndexingDocumentTaskFieldsFragment } }
  )> };

export type PageFieldsFragment = { __typename?: 'Page', page_id: any, content: string, description?: string | null, document_id: any, task_id: any, number: number, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } } & { ' $fragmentName'?: 'PageFieldsFragment' };

export type QaFieldsFragment = { __typename?: 'QA', answer: string, answer_tokens: number, chunk_id: any, chunk_number: number, created_at: any, document_id: any, document_published_at: any, model?: string | null, page_number_from: number, page_number_to: number, qa_id: string, question: string, question_tokens: number, task_id: any, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } } & { ' $fragmentName'?: 'QaFieldsFragment' };

export type QaWithDistanceFieldsFragment = { __typename?: 'QAWithDistance', distance: number, qa: (
    { __typename?: 'QA' }
    & { ' $fragmentRefs'?: { 'QaFieldsFragment': QaFieldsFragment } }
  ) } & { ' $fragmentName'?: 'QaWithDistanceFieldsFragment' };

export type QaWithDocumentsFieldsFragment = { __typename?: 'QAWithDocuments', document: (
    { __typename?: 'DocumentMeta' }
    & { ' $fragmentRefs'?: { 'DocumentFieldsFragment': DocumentFieldsFragment } }
  ), qas: Array<(
    { __typename?: 'QAWithDistance' }
    & { ' $fragmentRefs'?: { 'QaWithDistanceFieldsFragment': QaWithDistanceFieldsFragment } }
  )> } & { ' $fragmentName'?: 'QaWithDocumentsFieldsFragment' };

export type KdbQueryCollectionQaQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  collection_id: Array<Scalars['CollectionID']['input']> | Scalars['CollectionID']['input'];
  queryString: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
  limit?: Scalars['Int']['input'];
  tokensLimit?: Scalars['Int']['input'];
}>;


export type KdbQueryCollectionQaQuery = { __typename?: 'Query', kdbQueryCollectionQA: Array<(
    { __typename?: 'QAWithDistance' }
    & { ' $fragmentRefs'?: { 'QaWithDistanceFieldsFragment': QaWithDistanceFieldsFragment } }
  )> };

export type KdbQueryCollectionQaWithDocumentsQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  collection_id: Array<Scalars['CollectionID']['input']> | Scalars['CollectionID']['input'];
  queryString: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
  limit?: Scalars['Int']['input'];
  tokensLimit?: Scalars['Int']['input'];
}>;


export type KdbQueryCollectionQaWithDocumentsQuery = { __typename?: 'Query', kdbQueryCollectionQAWithDocuments: Array<(
    { __typename?: 'QAWithDocuments' }
    & { ' $fragmentRefs'?: { 'QaWithDocumentsFieldsFragment': QaWithDocumentsFieldsFragment } }
  )> };

export type KdbQueryParticipantCollectionQaQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  participantID: Scalars['ParticipantID']['input'];
  queryString: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
  limit?: Scalars['Int']['input'];
  tokensLimit?: Scalars['Int']['input'];
}>;


export type KdbQueryParticipantCollectionQaQuery = { __typename?: 'Query', kdbQueryParticipantCollectionQA: Array<(
    { __typename?: 'QAWithDistance' }
    & { ' $fragmentRefs'?: { 'QaWithDistanceFieldsFragment': QaWithDistanceFieldsFragment } }
  )> };

export type KdbSearchQaWithDocumentsQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  collections: Array<Scalars['CollectionID']['input']> | Scalars['CollectionID']['input'];
  queries: Array<Scalars['String']['input']> | Scalars['String']['input'];
  queries_weights?: InputMaybe<Array<Scalars['Float']['input']> | Scalars['Float']['input']>;
  options?: InputMaybe<SearchQaOptions>;
  filters?: InputMaybe<SearchQaFilters>;
  order_by?: InputMaybe<SearchQaOrderBy>;
}>;


export type KdbSearchQaWithDocumentsQuery = { __typename?: 'Query', kdbSearchQAWithDocuments: Array<{ __typename?: 'QAWithSimilarityByDocuments', document: (
      { __typename?: 'DocumentMeta' }
      & { ' $fragmentRefs'?: { 'DocumentFieldsFragment': DocumentFieldsFragment } }
    ), qas: Array<{ __typename?: 'QAWithSimilarity', similarity: number, qa: { __typename?: 'QA', answer: string, answer_tokens: number, chunk_id: any, chunk_number: number, created_at: any, document_id: any, document_published_at: any, model?: string | null, page_number_from: number, page_number_to: number, qa_id: string, question: string, question_tokens: number, task_id: any, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } } }> }> };

export type KdbCreateChunkMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  chunks: Array<ChunkInput> | ChunkInput;
}>;


export type KdbCreateChunkMutation = { __typename?: 'Mutation', kdbCreateChunk: Array<(
    { __typename?: 'Chunk' }
    & { ' $fragmentRefs'?: { 'ChunkFieldsFragment': ChunkFieldsFragment } }
  )> };

export type KdbCreateDocumentMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  doc: DocumentMetaInput;
}>;


export type KdbCreateDocumentMutation = { __typename?: 'Mutation', kdbCreateDocument: { __typename?: 'DocumentMeta', document_id: any, collection_id: any, url?: string | null, created_at: any, published_at: any, name?: string | null, description?: string | null, tags: Array<string>, metadata: Array<{ __typename?: 'DocumentMetadataKV', key: string, value: string }>, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } } };

export type KdbCreatePageMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  pages: Array<PageInput> | PageInput;
}>;


export type KdbCreatePageMutation = { __typename?: 'Mutation', kdbCreatePage: Array<(
    { __typename?: 'Page' }
    & { ' $fragmentRefs'?: { 'PageFieldsFragment': PageFieldsFragment } }
  )> };

export type KdbCreateQaMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  qa: CreateQaInput;
}>;


export type KdbCreateQaMutation = { __typename?: 'Mutation', kdbCreateQA: Array<(
    { __typename?: 'QA' }
    & { ' $fragmentRefs'?: { 'QaFieldsFragment': QaFieldsFragment } }
  )> };

export type KdbCreateTripletMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  triplets: CreateTripletInput;
}>;


export type KdbCreateTripletMutation = { __typename?: 'Mutation', kdbCreateTriplet: Array<{ __typename?: 'Triplet', chunk_id: any, document_id: any, task_id: any, object: string, predicate: string, subject: string, triplet_id: string, indexing_state: { __typename?: 'IndexingState', completion_cost: number, completion_tokens: number, content_tokens: number, embedding_cost: number, is_embedded: boolean, is_indexed_qa: boolean, is_indexed_triplet: boolean, is_parsed: boolean, is_summarized: boolean, prompt_cost: number, prompt_tokens: number } }> };

export type KdbIndexingDocumentTaskCreateMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  input: KdbIndexingDocumentTaskCreateInput;
}>;


export type KdbIndexingDocumentTaskCreateMutation = { __typename?: 'Mutation', kdbIndexingDocumentTaskCreate: { __typename?: 'IndexingDocumentTask', task_id: any, document_id: any, chat_id: any, message_id: any, author_id: any, task_state: IndexingDocumentTaskState, created_at: any, update_at: any, confirmed: boolean, version: number, error?: string | null, statistics: { __typename?: 'IndexingDocumentStatistics', chunks_indexed_qa: number, chunks_indexed_triplet: number, chunks_total: number, current_indexing_speed: number, expected_finish_seconds?: number | null, expected_finished_at?: any | null, indexed_percent: number, indexing_started_at?: any | null, llm_approximate_cost: number, pages: number, qa_total: number, total_tokens: number, triplets_total: number, indexed_for_seconds?: number | null, llm_stats: { __typename?: 'IndexingDocumentStatisticsLLM', completion_cost: number, embeddings_cost: number, embeddings_count: number, prompt_cost: number, total_cost: number } }, config: { __typename?: 'IndexingDocumentTaskConfig', chunk_overlap_tokens: number, chunk_size_tokens: number, cost_limit: number, need_qa: boolean, qa_count_per_run: number, qa_model: string, force_confirm: boolean, instruction_for_qa?: string | null } } };

export type KdbIndexingDocumentTaskErrorMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
  version: Scalars['Int']['input'];
  error: Scalars['String']['input'];
}>;


export type KdbIndexingDocumentTaskErrorMutation = { __typename?: 'Mutation', kdbIndexingDocumentTaskError: (
    { __typename?: 'IndexingDocumentTask' }
    & { ' $fragmentRefs'?: { 'IndexingDocumentTaskFieldsFragment': IndexingDocumentTaskFieldsFragment } }
  ) };

export type KdbIndexingDocumentTaskTransitionStateMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  taskID: Scalars['TaskID']['input'];
  toState: IndexingDocumentTaskState;
  version: Scalars['Int']['input'];
}>;


export type KdbIndexingDocumentTaskTransitionStateMutation = { __typename?: 'Mutation', kdbIndexingDocumentTaskTransitionState: (
    { __typename?: 'IndexingDocumentTask' }
    & { ' $fragmentRefs'?: { 'IndexingDocumentTaskFieldsFragment': IndexingDocumentTaskFieldsFragment } }
  ) };

export type MarketplaceAgentQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  agent_id: Scalars['AgentID']['input'];
}>;


export type MarketplaceAgentQuery = { __typename?: 'Query', marketplaceAgent: { __typename?: 'AgentMeta', agent_id: any, username: any, first_name: string, last_name?: string | null, avatar: string, role: string, can_answer: boolean, purpose: string, self_awareness: string, llm_model: string, owner_id: any, chain_graph_id: any, prompt: string, template_params: any, tools: Array<{ __typename?: 'Tool', name: string }>, llm_config: { __typename?: 'LLMConfig', model: string, max_tokens: number, temperature: number }, chat_history_config: { __typename?: 'ChatHistoryConfig', messages_count: number, tokens_limit: number } } };

export type AgentFieldsFragment = { __typename?: 'AgentMeta', agent_id: any, username: any, owner_id: any, first_name: string, last_name?: string | null, avatar: string, role: string, can_answer: boolean, chain_graph_id: any, skeleton: string, template_params: any, is_agent: boolean, deployment_status: DeploymentStatus, prompt: string, llm_model: string, purpose: string, self_awareness: string, llm_config: { __typename?: 'LLMConfig', model: string, temperature: number, max_tokens: number }, chat_history_config: { __typename?: 'ChatHistoryConfig', messages_count: number, tokens_limit: number }, tools: Array<{ __typename?: 'Tool', name: string }> } & { ' $fragmentName'?: 'AgentFieldsFragment' };

export type AgentCollectionFieldsFragment = { __typename?: 'AgentCollection', collection_id: string, title: string, description: string, owner_id: any, order: number, updated_at: any, agents: Array<(
    { __typename?: 'AgentMeta' }
    & { ' $fragmentRefs'?: { 'AgentFieldsFragment': AgentFieldsFragment } }
  )> } & { ' $fragmentName'?: 'AgentCollectionFieldsFragment' };

export type MarketplaceAgentsQueryVariables = Exact<{
  session: Scalars['Session']['input'];
}>;


export type MarketplaceAgentsQuery = { __typename?: 'Query', marketplaceAgents: Array<(
    { __typename?: 'AgentCollection' }
    & { ' $fragmentRefs'?: { 'AgentCollectionFieldsFragment': AgentCollectionFieldsFragment } }
  )> };

export type MessageFieldsFragment = { __typename?: 'Message', author: any, chat_id: any, deleted: boolean, error?: string | null, finished: boolean, id: any, is_system: boolean, meta: any, need_answer: boolean, reply_to?: any | null, text: string, time: any, total_usage_cost: any, type: MessageType, version: number, attachments?: Array<{ __typename?: 'Attachment', filename: string, id: any, mime_type: string, size: number, url: string }> | null, participant?: { __typename?: 'Participant', agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, llm_model: string, meta: any, participant_id: any, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, tools: Array<{ __typename?: 'Tool', name: string }> } | null, signals?: Array<{ __typename?: 'AgentTriggeredSignal', agent_id: any, message_id?: any | null }> | null } & { ' $fragmentName'?: 'MessageFieldsFragment' };

export type AuthAgentLoginMutationVariables = Exact<{
  agentID: Scalars['AgentID']['input'];
  session: Scalars['Session']['input'];
}>;


export type AuthAgentLoginMutation = { __typename?: 'Mutation', authAgentLogin: { __typename?: 'LoginResult', session: any, user_profile: { __typename?: 'UserProfile', id: any, name: string, picture: string } } };

export type AppendUsagesMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  usages: Array<UsageInput> | UsageInput;
}>;


export type AppendUsagesMutation = { __typename?: 'Mutation', appendUsages: boolean };

export type AuthMetamaskLoginMutationVariables = Exact<{
  input: MetamaskLoginInput;
}>;


export type AuthMetamaskLoginMutation = { __typename?: 'Mutation', authMetamaskLogin: { __typename?: 'LoginResult', session: any, user_profile: { __typename?: 'UserProfile', id: any, name: string, picture: string } } };

export type UploadAttachmentMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  attachment: AttachmentBlob;
}>;


export type UploadAttachmentMutation = { __typename?: 'Mutation', uploadAttachment: { __typename?: 'Attachment', id: any, mime_type: string, url: string } };

export type VoiceToTextMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  attachment_id: Scalars['AttachmentID']['input'];
}>;


export type VoiceToTextMutation = { __typename?: 'Mutation', voiceToText: { __typename?: 'DecodingResult', language: string, tokens: Array<number>, text: string, avg_logprob: number, no_speech_prob: number, temperature: number, compression_ratio: number } };

export type SubscribeChatRoomsSubscriptionVariables = Exact<{
  session: Scalars['Session']['input'];
  limit_chats?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SubscribeChatRoomsSubscription = { __typename?: 'Subscription', subscribeChatRooms: { __typename?: 'ChatRoomEvent', sub_id: any, event: ChatRoomEventType, chat_rooms?: Array<{ __typename?: 'ChatRoom', id: any, name: string, author: any, created_at: any, deleted_at?: any | null, deleted: boolean, meta: any, participants?: Array<{ __typename?: 'Participant', participant_id: any, agent_id: any, first_name: string, last_name?: string | null, username: string, avatar: string, is_agent: boolean, role?: string | null, purpose?: string | null, self_awareness?: string | null, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> }> | null }> | null, participants?: Array<{ __typename?: 'Participant', participant_id: any, agent_id: any, avatar: string, first_name: string, is_agent: boolean, last_name?: string | null, purpose?: string | null, role?: string | null, self_awareness?: string | null, username: string, llm_model: string, meta: any, tools: Array<{ __typename?: 'Tool', name: string }> }> | null } };

export type SubscribeMessagesSubscriptionVariables = Exact<{
  session: Scalars['Session']['input'];
  chat_id: Scalars['ChatID']['input'];
  limitMessages?: Scalars['Int']['input'];
}>;


export type SubscribeMessagesSubscription = { __typename?: 'Subscription', subscribeMessages: { __typename?: 'MessageEvent', event: Event, sub_id: any, message?: (
      { __typename?: 'Message' }
      & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
    ) | null, messages?: Array<(
      { __typename?: 'Message' }
      & { ' $fragmentRefs'?: { 'MessageFieldsFragment': MessageFieldsFragment } }
    )> | null } };

export type GetUserProfileQueryVariables = Exact<{
  session: Scalars['Session']['input'];
}>;


export type GetUserProfileQuery = { __typename?: 'Query', userProfile: { __typename?: 'UserProfile', email: any, id: any, name: string, picture: string, role: UserRole, tariffCurrent: UserTariff, tariffExpires?: any | null, externalAccounts: Array<{ __typename?: 'ExternalAccount', ID: any, providerID: ProviderId }> } };

export type VariableFieldsFragment = { __typename?: 'Variable', id: string, namespace: string, key: string, createdAt: any, updatedAt: any, value: { __typename?: 'VariableValue', type: VariableType, value: string } } & { ' $fragmentName'?: 'VariableFieldsFragment' };

export type GetVariableQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  namespace: NamespaceInput;
  key: Scalars['String']['input'];
}>;


export type GetVariableQuery = { __typename?: 'Query', getVariable: { __typename?: 'VariableResponse', variable?: (
      { __typename?: 'Variable' }
      & { ' $fragmentRefs'?: { 'VariableFieldsFragment': VariableFieldsFragment } }
    ) | null } };

export type GetVariablesQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  namespace: NamespaceInput;
}>;


export type GetVariablesQuery = { __typename?: 'Query', getVariables: { __typename?: 'VariablesResponse', variables?: Array<(
      { __typename?: 'Variable' }
      & { ' $fragmentRefs'?: { 'VariableFieldsFragment': VariableFieldsFragment } }
    )> | null } };

export type SetVariableMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  namespace: NamespaceInput;
  key: Scalars['String']['input'];
  value: VariableValueInput;
}>;


export type SetVariableMutation = { __typename?: 'Mutation', setVariable: { __typename?: 'VariableResponse', variable?: (
      { __typename?: 'Variable' }
      & { ' $fragmentRefs'?: { 'VariableFieldsFragment': VariableFieldsFragment } }
    ) | null } };

export type SetVariablesMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  namespace: NamespaceInput;
  variables: Array<KeyValueInput> | KeyValueInput;
}>;


export type SetVariablesMutation = { __typename?: 'Mutation', setVariables: { __typename?: 'VariablesResponse', variables?: Array<(
      { __typename?: 'Variable' }
      & { ' $fragmentRefs'?: { 'VariableFieldsFragment': VariableFieldsFragment } }
    )> | null } };

export type DeleteVariableMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  namespace: NamespaceInput;
  key: Scalars['String']['input'];
}>;


export type DeleteVariableMutation = { __typename?: 'Mutation', deleteVariable: boolean };

export type DeleteVariablesMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  namespace: NamespaceInput;
}>;


export type DeleteVariablesMutation = { __typename?: 'Mutation', deleteVariables: boolean };

export type AppendVariableMutationVariables = Exact<{
  session: Scalars['Session']['input'];
  namespace: NamespaceInput;
  key: Scalars['String']['input'];
  value: VariableValueInput;
}>;


export type AppendVariableMutation = { __typename?: 'Mutation', appendVariable: { __typename?: 'VariableResponse', variable?: (
      { __typename?: 'Variable' }
      & { ' $fragmentRefs'?: { 'VariableFieldsFragment': VariableFieldsFragment } }
    ) | null } };

export type ReadSecretQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  id: Scalars['SecretID']['input'];
  publicKey: Scalars['ECDHPublicKeyP256']['input'];
}>;


export type ReadSecretQuery = { __typename?: 'Query', secret: { __typename?: 'SecretResponse', publicKey: string, secret: { __typename?: 'Secret', encrypted: string, metadata: { __typename?: 'SecretMetadata', type: string } } } };

export const TwitterUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TwitterUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TwitterUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"profile_image_url"}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followers_count"}},{"kind":"Field","name":{"kind":"Name","value":"following_count"}},{"kind":"Field","name":{"kind":"Name","value":"listed_count"}},{"kind":"Field","name":{"kind":"Name","value":"tweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]} as unknown as DocumentNode<TwitterUserFieldsFragment, unknown>;
export const TweetFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TweetFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Tweet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversation_id"}},{"kind":"Field","name":{"kind":"Name","value":"in_reply_to_user_id"}},{"kind":"Field","name":{"kind":"Name","value":"reply_to_tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"mentioned_users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"like_count"}},{"kind":"Field","name":{"kind":"Name","value":"quote_count"}},{"kind":"Field","name":{"kind":"Name","value":"reply_count"}},{"kind":"Field","name":{"kind":"Name","value":"retweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quoted_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversation_id"}},{"kind":"Field","name":{"kind":"Name","value":"in_reply_to_user_id"}},{"kind":"Field","name":{"kind":"Name","value":"reply_to_tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"mentioned_users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"like_count"}},{"kind":"Field","name":{"kind":"Name","value":"quote_count"}},{"kind":"Field","name":{"kind":"Name","value":"reply_count"}},{"kind":"Field","name":{"kind":"Name","value":"retweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quoted_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversation_id"}},{"kind":"Field","name":{"kind":"Name","value":"in_reply_to_user_id"}},{"kind":"Field","name":{"kind":"Name","value":"reply_to_tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"mentioned_users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"like_count"}},{"kind":"Field","name":{"kind":"Name","value":"quote_count"}},{"kind":"Field","name":{"kind":"Name","value":"reply_count"}},{"kind":"Field","name":{"kind":"Name","value":"retweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quoted_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TwitterUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TwitterUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"profile_image_url"}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followers_count"}},{"kind":"Field","name":{"kind":"Name","value":"following_count"}},{"kind":"Field","name":{"kind":"Name","value":"listed_count"}},{"kind":"Field","name":{"kind":"Name","value":"tweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]} as unknown as DocumentNode<TweetFieldsFragment, unknown>;
export const ChunkFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChunkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Chunk"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}}]}}]} as unknown as DocumentNode<ChunkFieldsFragment, unknown>;
export const CollectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CollectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"creator_address"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}}]}}]} as unknown as DocumentNode<CollectionFieldsFragment, unknown>;
export const IndexingDocumentTaskFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IndexingDocumentTaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTask"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}},{"kind":"Field","name":{"kind":"Name","value":"author_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_state"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"update_at"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_total"}},{"kind":"Field","name":{"kind":"Name","value":"current_indexing_speed"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finish_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finished_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_percent"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_started_at"}},{"kind":"Field","name":{"kind":"Name","value":"llm_approximate_cost"}},{"kind":"Field","name":{"kind":"Name","value":"llm_stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_count"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"total_cost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"qa_total"}},{"kind":"Field","name":{"kind":"Name","value":"total_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"triplets_total"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_for_seconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_overlap_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_size_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"cost_limit"}},{"kind":"Field","name":{"kind":"Name","value":"need_qa"}},{"kind":"Field","name":{"kind":"Name","value":"qa_count_per_run"}},{"kind":"Field","name":{"kind":"Name","value":"qa_model"}},{"kind":"Field","name":{"kind":"Name","value":"force_confirm"}},{"kind":"Field","name":{"kind":"Name","value":"instruction_for_qa"}}]}}]}}]} as unknown as DocumentNode<IndexingDocumentTaskFieldsFragment, unknown>;
export const PageFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Page"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page_id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]} as unknown as DocumentNode<PageFieldsFragment, unknown>;
export const DocumentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"published_at"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}}]} as unknown as DocumentNode<DocumentFieldsFragment, unknown>;
export const QaFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QA"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}}]} as unknown as DocumentNode<QaFieldsFragment, unknown>;
export const QaWithDistanceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaWithDistanceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QAWithDistance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"qa"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"distance"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QA"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}}]} as unknown as DocumentNode<QaWithDistanceFieldsFragment, unknown>;
export const QaWithDocumentsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QAWithDocumentsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QAWithDocuments"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"qas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaWithDistanceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QA"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"published_at"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaWithDistanceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QAWithDistance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"qa"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"distance"}}]}}]} as unknown as DocumentNode<QaWithDocumentsFieldsFragment, unknown>;
export const AgentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"agentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"owner_id"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"can_answer"}},{"kind":"Field","name":{"kind":"Name","value":"chain_graph_id"}},{"kind":"Field","name":{"kind":"Name","value":"skeleton"}},{"kind":"Field","name":{"kind":"Name","value":"template_params"}},{"kind":"Field","name":{"kind":"Name","value":"llm_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"max_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"deployment_status"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"chat_history_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages_count"}},{"kind":"Field","name":{"kind":"Name","value":"tokens_limit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AgentFieldsFragment, unknown>;
export const AgentCollectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"agentCollectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentCollection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"owner_id"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"agents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"agentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"agentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"owner_id"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"can_answer"}},{"kind":"Field","name":{"kind":"Name","value":"chain_graph_id"}},{"kind":"Field","name":{"kind":"Name","value":"skeleton"}},{"kind":"Field","name":{"kind":"Name","value":"template_params"}},{"kind":"Field","name":{"kind":"Name","value":"llm_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"max_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"deployment_status"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"chat_history_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages_count"}},{"kind":"Field","name":{"kind":"Name","value":"tokens_limit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AgentCollectionFieldsFragment, unknown>;
export const MessageFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<MessageFieldsFragment, unknown>;
export const VariableFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"variableFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Variable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"namespace"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<VariableFieldsFragment, unknown>;
export const AdminAgentGetTwitterApiKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminAgentGetTwitterApiKeys"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AgentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminAgentGetTwitterApiKeys"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"agent_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"access_token"}},{"kind":"Field","name":{"kind":"Name","value":"access_token_secret"}},{"kind":"Field","name":{"kind":"Name","value":"consumer_key"}},{"kind":"Field","name":{"kind":"Name","value":"consumer_secret"}}]}}]}}]} as unknown as DocumentNode<AdminAgentGetTwitterApiKeysQuery, AdminAgentGetTwitterApiKeysQueryVariables>;
export const AdminGetParticipantTelegramBotApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetParticipantTelegramBotAPIKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminGetParticipantTelegramBotApiKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}}]}]}}]} as unknown as DocumentNode<AdminGetParticipantTelegramBotApiKeyQuery, AdminGetParticipantTelegramBotApiKeyQueryVariables>;
export const ChainGraphGetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"chainGraphGet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"participant_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParticipantID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chainGraphGet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"participant_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"participant_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"graph"}},{"kind":"Field","name":{"kind":"Name","value":"graph_id"}}]}}]}}]} as unknown as DocumentNode<ChainGraphGetQuery, ChainGraphGetQueryVariables>;
export const ChatRoomGetParticipantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatRoomGetParticipant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"participant_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParticipantID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chatRoomGetParticipant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"participant_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"participant_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}}]} as unknown as DocumentNode<ChatRoomGetParticipantQuery, ChatRoomGetParticipantQueryVariables>;
export const ChatRoomGetParticipantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatRoomGetParticipants"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chatRoomGetParticipants"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}}]} as unknown as DocumentNode<ChatRoomGetParticipantsQuery, ChatRoomGetParticipantsQueryVariables>;
export const GetChatRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChatRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getChatRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"last_message_time"}},{"kind":"Field","name":{"kind":"Name","value":"last_message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<GetChatRoomQuery, GetChatRoomQueryVariables>;
export const GetChatRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChatRooms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getChatRooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"last_message_time"}},{"kind":"Field","name":{"kind":"Name","value":"last_message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<GetChatRoomsQuery, GetChatRoomsQueryVariables>;
export const GetMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<GetMessageQuery, GetMessageQueryVariables>;
export const GetMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<GetMessagesQuery, GetMessagesQueryVariables>;
export const GetMessagesWithoutSystemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMessagesWithoutSystem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messagesWithoutSystem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<GetMessagesWithoutSystemQuery, GetMessagesWithoutSystemQueryVariables>;
export const AddAgentToChatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAgentToChat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AgentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAgentToChat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"agent_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}}}]}]}}]} as unknown as DocumentNode<AddAgentToChatMutation, AddAgentToChatMutationVariables>;
export const MessageAddDeltaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MessageAddDelta"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"delta"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addDelta"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"delta"},"value":{"kind":"Variable","name":{"kind":"Name","value":"delta"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<MessageAddDeltaMutation, MessageAddDeltaMutationVariables>;
export const AddMessageAttachmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMessageAttachment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"attachment_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttachmentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMessageAttachment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"attachment_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"attachment_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<AddMessageAttachmentMutation, AddMessageAttachmentMutationVariables>;
export const ChatRoomCreateParticipantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatRoomCreateParticipant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParticipantInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chatRoomCreateParticipant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}}]} as unknown as DocumentNode<ChatRoomCreateParticipantMutation, ChatRoomCreateParticipantMutationVariables>;
export const ChatRoomUpdateParticipantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatRoomUpdateParticipant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"participant_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParticipantID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParticipantInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chatRoomUpdateParticipant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"participant_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"participant_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}}]} as unknown as DocumentNode<ChatRoomUpdateParticipantMutation, ChatRoomUpdateParticipantMutationVariables>;
export const CreateChatRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChatRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agents"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AgentID"}}}},"defaultValue":{"kind":"ListValue","values":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChatRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"agents"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agents"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"last_message_time"}},{"kind":"Field","name":{"kind":"Name","value":"last_message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateChatRoomMutation, CreateChatRoomMutationVariables>;
export const DeleteChatRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteChatRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chatID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteChatRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chatID"}}}]}]}}]} as unknown as DocumentNode<DeleteChatRoomMutation, DeleteChatRoomMutationVariables>;
export const DeleteMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteMessageMutation, DeleteMessageMutationVariables>;
export const EditMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageEditInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"message"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<EditMessageMutation, EditMessageMutationVariables>;
export const FinishMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinishMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finishMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<FinishMessageMutation, FinishMessageMutationVariables>;
export const RegenerateLastResponseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegenerateLastResponse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regenerateLastResponse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}}]}]}}]} as unknown as DocumentNode<RegenerateLastResponseMutation, RegenerateLastResponseMutationVariables>;
export const RenameChatRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RenameChatRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"new_name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"renameChatRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"new_name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"new_name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"last_message_time"}},{"kind":"Field","name":{"kind":"Name","value":"last_message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<RenameChatRoomMutation, RenameChatRoomMutationVariables>;
export const SendMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"message"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<SendMessageMutation, SendMessageMutationVariables>;
export const SetMessageMetaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetMessageMeta"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message_meta"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageMetaInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setMessageMeta"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"message_meta"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message_meta"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<SetMessageMetaMutation, SetMessageMetaMutationVariables>;
export const StopCompletionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopCompletion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopCompletion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}}]}]}}]} as unknown as DocumentNode<StopCompletionMutation, StopCompletionMutationVariables>;
export const UnsubscribeMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnsubscribeMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sub_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubscriptionID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unsubscribeMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"sub_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sub_id"}}}]}]}}]} as unknown as DocumentNode<UnsubscribeMessagesMutation, UnsubscribeMessagesMutationVariables>;
export const AuthMetamaskMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthMetamaskMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MetamaskAddress"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authMetamaskMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}]}}]} as unknown as DocumentNode<AuthMetamaskMessageQuery, AuthMetamaskMessageQueryVariables>;
export const GetTweetsFromDbDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTweetsFromDB"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tweets_ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TweetID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTweetsFromDB"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"tweets_ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tweets_ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TweetFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TwitterUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TwitterUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"profile_image_url"}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followers_count"}},{"kind":"Field","name":{"kind":"Name","value":"following_count"}},{"kind":"Field","name":{"kind":"Name","value":"listed_count"}},{"kind":"Field","name":{"kind":"Name","value":"tweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TweetFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Tweet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversation_id"}},{"kind":"Field","name":{"kind":"Name","value":"in_reply_to_user_id"}},{"kind":"Field","name":{"kind":"Name","value":"reply_to_tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"mentioned_users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"like_count"}},{"kind":"Field","name":{"kind":"Name","value":"quote_count"}},{"kind":"Field","name":{"kind":"Name","value":"reply_count"}},{"kind":"Field","name":{"kind":"Name","value":"retweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quoted_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversation_id"}},{"kind":"Field","name":{"kind":"Name","value":"in_reply_to_user_id"}},{"kind":"Field","name":{"kind":"Name","value":"reply_to_tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"mentioned_users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"like_count"}},{"kind":"Field","name":{"kind":"Name","value":"quote_count"}},{"kind":"Field","name":{"kind":"Name","value":"reply_count"}},{"kind":"Field","name":{"kind":"Name","value":"retweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quoted_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversation_id"}},{"kind":"Field","name":{"kind":"Name","value":"in_reply_to_user_id"}},{"kind":"Field","name":{"kind":"Name","value":"reply_to_tweet_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"mentioned_users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TwitterUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"public_metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"like_count"}},{"kind":"Field","name":{"kind":"Name","value":"quote_count"}},{"kind":"Field","name":{"kind":"Name","value":"reply_count"}},{"kind":"Field","name":{"kind":"Name","value":"retweet_count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quoted_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_tweet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"tweet_id"}}]}}]}}]} as unknown as DocumentNode<GetTweetsFromDbQuery, GetTweetsFromDbQueryVariables>;
export const KdbGetParticipantCollectionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetParticipantCollections"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AgentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetAgentCollections"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"agent_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CollectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CollectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"creator_address"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}}]}}]} as unknown as DocumentNode<KdbGetParticipantCollectionsQuery, KdbGetParticipantCollectionsQueryVariables>;
export const KdbGetChunkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetChunk"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chunk_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChunkID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetChunk"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chunk_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chunk_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChunkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChunkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Chunk"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}}]}}]} as unknown as DocumentNode<KdbGetChunkQuery, KdbGetChunkQueryVariables>;
export const KdbGetChunksByDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetChunksByDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"document_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetChunksByDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"document_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"document_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChunkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChunkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Chunk"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}}]}}]} as unknown as DocumentNode<KdbGetChunksByDocumentQuery, KdbGetChunksByDocumentQueryVariables>;
export const KdbGetChunksByTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetChunksByTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"task_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetChunksByTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"task_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"task_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChunkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChunkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Chunk"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}}]}}]} as unknown as DocumentNode<KdbGetChunksByTaskQuery, KdbGetChunksByTaskQueryVariables>;
export const KdbGetCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CollectionID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"collection_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CollectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CollectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"creator_address"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}}]}}]} as unknown as DocumentNode<KdbGetCollectionQuery, KdbGetCollectionQueryVariables>;
export const KdbGetDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetDocuments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"document_ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetDocuments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"document_ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"document_ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"published_at"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}}]} as unknown as DocumentNode<KdbGetDocumentsQuery, KdbGetDocumentsQueryVariables>;
export const KdbGetDocumentsByCollectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetDocumentsByCollection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CollectionID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"GetDocumentsByCollectionFilters"}},"defaultValue":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"published_range"},"value":{"kind":"ObjectValue","fields":[]}}]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order_by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"GetDocumentsByCollectionOrderByInput"}},"defaultValue":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"field"},"value":{"kind":"EnumValue","value":"PUBLISHED_AT"}},{"kind":"ObjectField","name":{"kind":"Name","value":"direction"},"value":{"kind":"EnumValue","value":"Asc"}}]}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"1000"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetDocumentsByCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"collection_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order_by"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagesCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"published_at"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}}]} as unknown as DocumentNode<KdbGetDocumentsByCollectionQuery, KdbGetDocumentsByCollectionQueryVariables>;
export const KdbGetPagesByDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetPagesByDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"document_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetPagesByDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"document_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"document_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page_id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]}}]} as unknown as DocumentNode<KdbGetPagesByDocumentQuery, KdbGetPagesByDocumentQueryVariables>;
export const KdbGetPagesByTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBGetPagesByTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"task_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbGetPagesByTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"task_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"task_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Page"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page_id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]} as unknown as DocumentNode<KdbGetPagesByTaskQuery, KdbGetPagesByTaskQueryVariables>;
export const KdbIndexingDocumentTaskGetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBIndexingDocumentTaskGet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbIndexingDocumentTaskGet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IndexingDocumentTaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IndexingDocumentTaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTask"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}},{"kind":"Field","name":{"kind":"Name","value":"author_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_state"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"update_at"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_total"}},{"kind":"Field","name":{"kind":"Name","value":"current_indexing_speed"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finish_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finished_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_percent"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_started_at"}},{"kind":"Field","name":{"kind":"Name","value":"llm_approximate_cost"}},{"kind":"Field","name":{"kind":"Name","value":"llm_stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_count"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"total_cost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"qa_total"}},{"kind":"Field","name":{"kind":"Name","value":"total_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"triplets_total"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_for_seconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_overlap_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_size_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"cost_limit"}},{"kind":"Field","name":{"kind":"Name","value":"need_qa"}},{"kind":"Field","name":{"kind":"Name","value":"qa_count_per_run"}},{"kind":"Field","name":{"kind":"Name","value":"qa_model"}},{"kind":"Field","name":{"kind":"Name","value":"force_confirm"}},{"kind":"Field","name":{"kind":"Name","value":"instruction_for_qa"}}]}}]}}]} as unknown as DocumentNode<KdbIndexingDocumentTaskGetQuery, KdbIndexingDocumentTaskGetQueryVariables>;
export const KdbIndexingDocumentTaskGetByDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"kdbIndexingDocumentTaskGetByDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"document_id"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbIndexingDocumentTaskGetByDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"document_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"document_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IndexingDocumentTaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IndexingDocumentTaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTask"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}},{"kind":"Field","name":{"kind":"Name","value":"author_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_state"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"update_at"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_total"}},{"kind":"Field","name":{"kind":"Name","value":"current_indexing_speed"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finish_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finished_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_percent"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_started_at"}},{"kind":"Field","name":{"kind":"Name","value":"llm_approximate_cost"}},{"kind":"Field","name":{"kind":"Name","value":"llm_stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_count"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"total_cost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"qa_total"}},{"kind":"Field","name":{"kind":"Name","value":"total_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"triplets_total"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_for_seconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_overlap_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_size_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"cost_limit"}},{"kind":"Field","name":{"kind":"Name","value":"need_qa"}},{"kind":"Field","name":{"kind":"Name","value":"qa_count_per_run"}},{"kind":"Field","name":{"kind":"Name","value":"qa_model"}},{"kind":"Field","name":{"kind":"Name","value":"force_confirm"}},{"kind":"Field","name":{"kind":"Name","value":"instruction_for_qa"}}]}}]}}]} as unknown as DocumentNode<KdbIndexingDocumentTaskGetByDocumentQuery, KdbIndexingDocumentTaskGetByDocumentQueryVariables>;
export const KdbIndexingDocumentTaskGetByStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBIndexingDocumentTaskGetByState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTaskState"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbIndexingDocumentTaskGetByState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IndexingDocumentTaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IndexingDocumentTaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTask"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}},{"kind":"Field","name":{"kind":"Name","value":"author_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_state"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"update_at"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_total"}},{"kind":"Field","name":{"kind":"Name","value":"current_indexing_speed"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finish_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finished_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_percent"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_started_at"}},{"kind":"Field","name":{"kind":"Name","value":"llm_approximate_cost"}},{"kind":"Field","name":{"kind":"Name","value":"llm_stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_count"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"total_cost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"qa_total"}},{"kind":"Field","name":{"kind":"Name","value":"total_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"triplets_total"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_for_seconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_overlap_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_size_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"cost_limit"}},{"kind":"Field","name":{"kind":"Name","value":"need_qa"}},{"kind":"Field","name":{"kind":"Name","value":"qa_count_per_run"}},{"kind":"Field","name":{"kind":"Name","value":"qa_model"}},{"kind":"Field","name":{"kind":"Name","value":"force_confirm"}},{"kind":"Field","name":{"kind":"Name","value":"instruction_for_qa"}}]}}]}}]} as unknown as DocumentNode<KdbIndexingDocumentTaskGetByStateQuery, KdbIndexingDocumentTaskGetByStateQueryVariables>;
export const KdbQueryCollectionQaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBQueryCollectionQA"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CollectionID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queryString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},"defaultValue":{"kind":"FloatValue","value":"0.5"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tokensLimit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"4000"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbQueryCollectionQA"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"collection_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"queryString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queryString"}}},{"kind":"Argument","name":{"kind":"Name","value":"threshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"tokensLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tokensLimit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaWithDistanceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QA"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaWithDistanceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QAWithDistance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"qa"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"distance"}}]}}]} as unknown as DocumentNode<KdbQueryCollectionQaQuery, KdbQueryCollectionQaQueryVariables>;
export const KdbQueryCollectionQaWithDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"kdbQueryCollectionQAWithDocuments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CollectionID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queryString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},"defaultValue":{"kind":"FloatValue","value":"0.5"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tokensLimit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"4000"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbQueryCollectionQAWithDocuments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"collection_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collection_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"queryString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queryString"}}},{"kind":"Argument","name":{"kind":"Name","value":"threshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"tokensLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tokensLimit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QAWithDocumentsFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"published_at"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QA"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaWithDistanceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QAWithDistance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"qa"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"distance"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QAWithDocumentsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QAWithDocuments"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"qas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaWithDistanceFields"}}]}}]}}]} as unknown as DocumentNode<KdbQueryCollectionQaWithDocumentsQuery, KdbQueryCollectionQaWithDocumentsQueryVariables>;
export const KdbQueryParticipantCollectionQaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"KDBQueryParticipantCollectionQA"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"participantID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParticipantID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queryString"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},"defaultValue":{"kind":"FloatValue","value":"0.5"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tokensLimit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"4000"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbQueryParticipantCollectionQA"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"participantID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"participantID"}}},{"kind":"Argument","name":{"kind":"Name","value":"queryString"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queryString"}}},{"kind":"Argument","name":{"kind":"Name","value":"threshold"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threshold"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"tokensLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tokensLimit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaWithDistanceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QA"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaWithDistanceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QAWithDistance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"qa"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"distance"}}]}}]} as unknown as DocumentNode<KdbQueryParticipantCollectionQaQuery, KdbQueryParticipantCollectionQaQueryVariables>;
export const KdbSearchQaWithDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"kdbSearchQAWithDocuments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collections"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CollectionID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queries"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queries_weights"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchQAOptions"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchQAFilters"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order_by"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchQAOrderBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbSearchQAWithDocuments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"collections"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collections"}}},{"kind":"Argument","name":{"kind":"Name","value":"queries"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queries"}}},{"kind":"Argument","name":{"kind":"Name","value":"queries_weights"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queries_weights"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order_by"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"qas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"qa"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"similarity"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"published_at"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}}]} as unknown as DocumentNode<KdbSearchQaWithDocumentsQuery, KdbSearchQaWithDocumentsQueryVariables>;
export const KdbCreateChunkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBCreateChunk"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chunks"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChunkInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbCreateChunk"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chunks"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chunks"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChunkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChunkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Chunk"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}}]}}]} as unknown as DocumentNode<KdbCreateChunkMutation, KdbCreateChunkMutationVariables>;
export const KdbCreateDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBCreateDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"doc"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentMetaInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbCreateDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"doc"},"value":{"kind":"Variable","name":{"kind":"Name","value":"doc"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"published_at"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}}]}}]} as unknown as DocumentNode<KdbCreateDocumentMutation, KdbCreateDocumentMutationVariables>;
export const KdbCreatePageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBCreatePage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pages"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PageInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbCreatePage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"pages"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pages"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Page"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page_id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]} as unknown as DocumentNode<KdbCreatePageMutation, KdbCreatePageMutationVariables>;
export const KdbCreateQaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBCreateQA"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"qa"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateQAInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbCreateQA"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"qa"},"value":{"kind":"Variable","name":{"kind":"Name","value":"qa"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QaFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QA"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"answer"}},{"kind":"Field","name":{"kind":"Name","value":"answer_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_number"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_published_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_from"}},{"kind":"Field","name":{"kind":"Name","value":"page_number_to"}},{"kind":"Field","name":{"kind":"Name","value":"qa_id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"question_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}}]}}]} as unknown as DocumentNode<KdbCreateQaMutation, KdbCreateQaMutationVariables>;
export const KdbCreateTripletDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBCreateTriplet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"triplets"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTripletInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbCreateTriplet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"triplet"},"value":{"kind":"Variable","name":{"kind":"Name","value":"triplets"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"object"}},{"kind":"Field","name":{"kind":"Name","value":"predicate"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"triplet_id"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"completion_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"content_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"embedding_cost"}},{"kind":"Field","name":{"kind":"Name","value":"is_embedded"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"is_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"is_parsed"}},{"kind":"Field","name":{"kind":"Name","value":"is_summarized"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_tokens"}}]}}]}}]}}]} as unknown as DocumentNode<KdbCreateTripletMutation, KdbCreateTripletMutationVariables>;
export const KdbIndexingDocumentTaskCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBIndexingDocumentTaskCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"KdbIndexingDocumentTaskCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbIndexingDocumentTaskCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}},{"kind":"Field","name":{"kind":"Name","value":"author_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_state"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"update_at"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_total"}},{"kind":"Field","name":{"kind":"Name","value":"current_indexing_speed"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finish_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finished_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_percent"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_started_at"}},{"kind":"Field","name":{"kind":"Name","value":"llm_approximate_cost"}},{"kind":"Field","name":{"kind":"Name","value":"llm_stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_count"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"total_cost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"qa_total"}},{"kind":"Field","name":{"kind":"Name","value":"total_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"triplets_total"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_for_seconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_overlap_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_size_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"cost_limit"}},{"kind":"Field","name":{"kind":"Name","value":"need_qa"}},{"kind":"Field","name":{"kind":"Name","value":"qa_count_per_run"}},{"kind":"Field","name":{"kind":"Name","value":"qa_model"}},{"kind":"Field","name":{"kind":"Name","value":"force_confirm"}},{"kind":"Field","name":{"kind":"Name","value":"instruction_for_qa"}}]}}]}}]}}]} as unknown as DocumentNode<KdbIndexingDocumentTaskCreateMutation, KdbIndexingDocumentTaskCreateMutationVariables>;
export const KdbIndexingDocumentTaskErrorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBIndexingDocumentTaskError"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"error"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbIndexingDocumentTaskError"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskID"}}},{"kind":"Argument","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}},{"kind":"Argument","name":{"kind":"Name","value":"error"},"value":{"kind":"Variable","name":{"kind":"Name","value":"error"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IndexingDocumentTaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IndexingDocumentTaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTask"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}},{"kind":"Field","name":{"kind":"Name","value":"author_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_state"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"update_at"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_total"}},{"kind":"Field","name":{"kind":"Name","value":"current_indexing_speed"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finish_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finished_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_percent"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_started_at"}},{"kind":"Field","name":{"kind":"Name","value":"llm_approximate_cost"}},{"kind":"Field","name":{"kind":"Name","value":"llm_stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_count"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"total_cost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"qa_total"}},{"kind":"Field","name":{"kind":"Name","value":"total_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"triplets_total"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_for_seconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_overlap_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_size_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"cost_limit"}},{"kind":"Field","name":{"kind":"Name","value":"need_qa"}},{"kind":"Field","name":{"kind":"Name","value":"qa_count_per_run"}},{"kind":"Field","name":{"kind":"Name","value":"qa_model"}},{"kind":"Field","name":{"kind":"Name","value":"force_confirm"}},{"kind":"Field","name":{"kind":"Name","value":"instruction_for_qa"}}]}}]}}]} as unknown as DocumentNode<KdbIndexingDocumentTaskErrorMutation, KdbIndexingDocumentTaskErrorMutationVariables>;
export const KdbIndexingDocumentTaskTransitionStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KDBIndexingDocumentTaskTransitionState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toState"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTaskState"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kdbIndexingDocumentTaskTransitionState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskID"}}},{"kind":"Argument","name":{"kind":"Name","value":"toState"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toState"}}},{"kind":"Argument","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IndexingDocumentTaskFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IndexingDocumentTaskFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IndexingDocumentTask"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"document_id"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}},{"kind":"Field","name":{"kind":"Name","value":"author_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_state"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"update_at"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_qa"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_indexed_triplet"}},{"kind":"Field","name":{"kind":"Name","value":"chunks_total"}},{"kind":"Field","name":{"kind":"Name","value":"current_indexing_speed"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finish_seconds"}},{"kind":"Field","name":{"kind":"Name","value":"expected_finished_at"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_percent"}},{"kind":"Field","name":{"kind":"Name","value":"indexing_started_at"}},{"kind":"Field","name":{"kind":"Name","value":"llm_approximate_cost"}},{"kind":"Field","name":{"kind":"Name","value":"llm_stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completion_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_cost"}},{"kind":"Field","name":{"kind":"Name","value":"embeddings_count"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_cost"}},{"kind":"Field","name":{"kind":"Name","value":"total_cost"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"qa_total"}},{"kind":"Field","name":{"kind":"Name","value":"total_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"triplets_total"}},{"kind":"Field","name":{"kind":"Name","value":"indexed_for_seconds"}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chunk_overlap_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"chunk_size_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"cost_limit"}},{"kind":"Field","name":{"kind":"Name","value":"need_qa"}},{"kind":"Field","name":{"kind":"Name","value":"qa_count_per_run"}},{"kind":"Field","name":{"kind":"Name","value":"qa_model"}},{"kind":"Field","name":{"kind":"Name","value":"force_confirm"}},{"kind":"Field","name":{"kind":"Name","value":"instruction_for_qa"}}]}}]}}]} as unknown as DocumentNode<KdbIndexingDocumentTaskTransitionStateMutation, KdbIndexingDocumentTaskTransitionStateMutationVariables>;
export const MarketplaceAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarketplaceAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AgentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketplaceAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"agent_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agent_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"can_answer"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"owner_id"}},{"kind":"Field","name":{"kind":"Name","value":"chain_graph_id"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"llm_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"max_tokens"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}}]}},{"kind":"Field","name":{"kind":"Name","value":"chat_history_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages_count"}},{"kind":"Field","name":{"kind":"Name","value":"tokens_limit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"template_params"}}]}}]}}]} as unknown as DocumentNode<MarketplaceAgentQuery, MarketplaceAgentQueryVariables>;
export const MarketplaceAgentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarketplaceAgents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketplaceAgents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"agentCollectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"agentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"owner_id"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"can_answer"}},{"kind":"Field","name":{"kind":"Name","value":"chain_graph_id"}},{"kind":"Field","name":{"kind":"Name","value":"skeleton"}},{"kind":"Field","name":{"kind":"Name","value":"template_params"}},{"kind":"Field","name":{"kind":"Name","value":"llm_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"max_tokens"}}]}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"deployment_status"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"chat_history_config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages_count"}},{"kind":"Field","name":{"kind":"Name","value":"tokens_limit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"agentCollectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentCollection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection_id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"owner_id"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"agents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"agentFields"}}]}}]}}]} as unknown as DocumentNode<MarketplaceAgentsQuery, MarketplaceAgentsQueryVariables>;
export const AuthAgentLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthAgentLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AgentID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authAgentLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentID"}}},{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"}},{"kind":"Field","name":{"kind":"Name","value":"user_profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}}]}}]}}]}}]} as unknown as DocumentNode<AuthAgentLoginMutation, AuthAgentLoginMutationVariables>;
export const AppendUsagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AppendUsages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"usages"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UsageInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appendUsages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"usages"},"value":{"kind":"Variable","name":{"kind":"Name","value":"usages"}}}]}]}}]} as unknown as DocumentNode<AppendUsagesMutation, AppendUsagesMutationVariables>;
export const AuthMetamaskLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthMetamaskLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MetamaskLoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authMetamaskLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"}},{"kind":"Field","name":{"kind":"Name","value":"user_profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}}]}}]}}]}}]} as unknown as DocumentNode<AuthMetamaskLoginMutation, AuthMetamaskLoginMutationVariables>;
export const UploadAttachmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UploadAttachment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"attachment"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttachmentBlob"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadAttachment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"attachment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"attachment"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<UploadAttachmentMutation, UploadAttachmentMutationVariables>;
export const VoiceToTextDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VoiceToText"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"attachment_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttachmentID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voiceToText"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"attachment_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"attachment_id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"tokens"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"avg_logprob"}},{"kind":"Field","name":{"kind":"Name","value":"no_speech_prob"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"compression_ratio"}}]}}]}}]} as unknown as DocumentNode<VoiceToTextMutation, VoiceToTextMutationVariables>;
export const SubscribeChatRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeChatRooms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit_chats"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subscribeChatRooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit_chats"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit_chats"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sub_id"}},{"kind":"Field","name":{"kind":"Name","value":"event"}},{"kind":"Field","name":{"kind":"Name","value":"chat_rooms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted_at"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeChatRoomsSubscription, SubscribeChatRoomsSubscriptionVariables>;
export const SubscribeMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitMessages"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subscribeMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"chat_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chat_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"limitMessages"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitMessages"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"event"}},{"kind":"Field","name":{"kind":"Name","value":"sub_id"}},{"kind":"Field","name":{"kind":"Name","value":"message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mime_type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"chat_id"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finished"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_system"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"need_answer"}},{"kind":"Field","name":{"kind":"Name","value":"participant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"first_name"}},{"kind":"Field","name":{"kind":"Name","value":"is_agent"}},{"kind":"Field","name":{"kind":"Name","value":"last_name"}},{"kind":"Field","name":{"kind":"Name","value":"llm_model"}},{"kind":"Field","name":{"kind":"Name","value":"meta"}},{"kind":"Field","name":{"kind":"Name","value":"participant_id"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"self_awareness"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reply_to"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"total_usage_cost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"signals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentTriggeredSignal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent_id"}},{"kind":"Field","name":{"kind":"Name","value":"message_id"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeMessagesSubscription, SubscribeMessagesSubscriptionVariables>;
export const GetUserProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"externalAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"providerID"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"tariffCurrent"}},{"kind":"Field","name":{"kind":"Name","value":"tariffExpires"}}]}}]}}]} as unknown as DocumentNode<GetUserProfileQuery, GetUserProfileQueryVariables>;
export const GetVariableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVariable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NamespaceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getVariable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variable"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"variableFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"variableFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Variable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"namespace"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetVariableQuery, GetVariableQueryVariables>;
export const GetVariablesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVariables"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NamespaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getVariables"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variables"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"variableFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"variableFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Variable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"namespace"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetVariablesQuery, GetVariablesQueryVariables>;
export const SetVariableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetVariable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NamespaceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VariableValueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setVariable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variable"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"variableFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"variableFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Variable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"namespace"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SetVariableMutation, SetVariableMutationVariables>;
export const SetVariablesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetVariables"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NamespaceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"variables"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"KeyValueInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setVariables"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}},{"kind":"Argument","name":{"kind":"Name","value":"variables"},"value":{"kind":"Variable","name":{"kind":"Name","value":"variables"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variables"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"variableFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"variableFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Variable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"namespace"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SetVariablesMutation, SetVariablesMutationVariables>;
export const DeleteVariableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVariable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NamespaceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteVariable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}]}]}}]} as unknown as DocumentNode<DeleteVariableMutation, DeleteVariableMutationVariables>;
export const DeleteVariablesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteVariables"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NamespaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteVariables"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}}]}]}}]} as unknown as DocumentNode<DeleteVariablesMutation, DeleteVariablesMutationVariables>;
export const AppendVariableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AppendVariable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NamespaceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VariableValueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appendVariable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"variable"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"variableFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"variableFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Variable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"namespace"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AppendVariableMutation, AppendVariableMutationVariables>;
export const ReadSecretDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadSecret"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SecretID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"publicKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ECDHPublicKeyP256"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"secret"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"publicKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"publicKey"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"secret"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"encrypted"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicKey"}}]}}]}}]} as unknown as DocumentNode<ReadSecretQuery, ReadSecretQueryVariables>;
