export type NotificationType = 'Event' | 'Result' | 'Placement';

export interface NotificationItem {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
}

export interface RegisterRequest {
  email: string;
  name: string;
  mobileNo: string;
  githubUsername: string;
  rollNo: string;
  accessCode: string;
}

export interface AuthRequest {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
}

export interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

const BASE_URL = 'http://20.207.122.201/evaluation-service';

async function fetchJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.message || `HTTP ${response.status}`);
    throw error;
  }
  return payload as T;
}

export async function registerUser(payload: RegisterRequest) {
  return fetchJson<{ email: string; name: string; rollNo: string; accessCode: string }>(
    `${BASE_URL}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
}

export async function authenticateUser(payload: AuthRequest) {
  return fetchJson<AuthResponse>(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchNotifications(
  token: string,
  options: {
    limit?: number;
    page?: number;
    notification_type?: NotificationType | 'All';
  }
) {
  const url = new URL(`${BASE_URL}/notifications`);

  if (options.limit != null) {
    url.searchParams.set('limit', String(options.limit));
  }
  if (options.page != null) {
    url.searchParams.set('page', String(options.page));
  }
  if (options.notification_type && options.notification_type !== 'All') {
    url.searchParams.set('notification_type', options.notification_type);
  }

  return fetchJson<NotificationsResponse>(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
