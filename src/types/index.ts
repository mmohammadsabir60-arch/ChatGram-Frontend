export interface User {
  id: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  created_at: string;
  last_seen_at: string;
}

export type RelationshipState =
  | 'none'
  | 'request_sent'
  | 'request_received'
  | 'friends'
  | 'blocked';

export interface UserSearchResult {
  id: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  last_seen_at: string;
  relationship_state: RelationshipState;
  friendship_id?: string | null;
}

export interface UserSearchResponse {
  items: UserSearchResult[];
  next_cursor?: string | null;
}

export interface FriendRequest {
  id: string;
  requester: User;
  addressee: User;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface FriendRequestsListResponse {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  incoming_count: number;
  outgoing_count: number;
}

export interface FriendItem {
  friendship_id: string;
  user: User;
  created_at: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  body: string;
  client_id?: string | null;
  created_at: string;
  deleted_for_sender?: boolean;
  deleted_for_all?: boolean;
  is_mine?: boolean;
  status?: MessageStatus;
}

export interface Conversation {
  id: string;
  other_user: User;
  last_message?: Message | null;
  last_message_at: string;
  unread_count: number;
}

export interface MessagesListResponse {
  items: Message[];
  next_cursor?: number | null;
  has_more: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WsTicketResponse {
  ticket: string;
  expires_in: number;
}

