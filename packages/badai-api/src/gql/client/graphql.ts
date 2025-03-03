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
  kdbGetDocumentsByCollection: Array<DocumentMeta>;
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
  session: Scalars['Session']['input'];
};


export type QueryKdbGetPagesByDocumentArgs = {
  document_id: Scalars['DocumentID']['input'];
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

export type ReadSecretQueryVariables = Exact<{
  session: Scalars['Session']['input'];
  id: Scalars['SecretID']['input'];
  publicKey: Scalars['ECDHPublicKeyP256']['input'];
}>;


export type ReadSecretQuery = { __typename?: 'Query', secret: { __typename?: 'SecretResponse', publicKey: string, secret: { __typename?: 'Secret', encrypted: string, metadata: { __typename?: 'SecretMetadata', type: string } } } };


export const ReadSecretDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadSecret"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"session"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SecretID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"publicKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ECDHPublicKeyP256"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"secret"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"session"},"value":{"kind":"Variable","name":{"kind":"Name","value":"session"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"publicKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"publicKey"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"secret"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"encrypted"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicKey"}}]}}]}}]} as unknown as DocumentNode<ReadSecretQuery, ReadSecretQueryVariables>;
