export enum FlowSubscriptionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  SUBSCRIBED = 'SUBSCRIBED',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

export interface FlowSubscriptionError {
  message: string
  code?: string
  timestamp: Date
}
