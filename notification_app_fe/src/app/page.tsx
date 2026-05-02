"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AuthPanel from '@/components/AuthPanel';
import NotificationCard from '@/components/NotificationCard';
import ThemeProvider from '@/components/ThemeProvider';
import { fetchNotifications, NotificationItem, NotificationType } from '@/lib/api';

const STORAGE_KEY = 'notificationAppViewedIds';

function parseStoredViewedIds() {
  if (typeof window === 'undefined') {
    return new Set<string>();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

export default function Home() {
  const [authToken, setAuthToken] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'All'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(8);
  const [page, setPage] = useState(1);
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => parseStoredViewedIds());

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const loadNotifications = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await fetchNotifications(authToken, {
          limit,
          page,
          notification_type: selectedType,
        });
        setNotifications(payload.notifications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to fetch notifications.');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [authToken, selectedType, limit, page]);

  const handleAuthSuccess = (token: string, type: NotificationType | 'All') => {
    setAuthToken(token);
    setSelectedType(type);
    setPage(1);
  };

  const handleFilterChange = (type: NotificationType | 'All') => {
    setSelectedType(type);
    setPage(1);
  };

  const handleViewNotification = (id: string) => {
    if (viewedIds.has(id)) {
      return;
    }

    const next = new Set(viewedIds).add(id);
    setViewedIds(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  };

  const handlePageChange = (nextPage: number) => {
    setPage(Math.max(1, nextPage));
  };

  const handleLimitChange = (value: string) => {
    const parsed = Number(value);
    setLimit(parsed >= 1 ? parsed : 8);
    setPage(1);
  };

  const markAllViewed = () => {
    const next = new Set(viewedIds);
    notifications.forEach((item) => next.add(item.ID));
    setViewedIds(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !viewedIds.has(item.ID)).length,
    [notifications, viewedIds]
  );

  const priorityNotifications = useMemo(
    () =>
      [...notifications]
        .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime())
        .slice(0, 3),
    [notifications]
  );

  return (
    <ThemeProvider>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Notification Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Securely authenticate, filter protected notifications, and review priority alerts.
            </Typography>
          </Box>

          <AuthPanel onAuthSuccess={handleAuthSuccess} onTypeChange={handleFilterChange} defaultType={selectedType} />

          <Card elevation={1} sx={{ p: 2, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'center' }}>
                <TextField
                  label="Page"
                  type="number"
                  value={page}
                  onChange={(event) => handlePageChange(Number(event.target.value))}
                  fullWidth
                />
                <TextField
                  label="Limit"
                  type="number"
                  value={limit}
                  onChange={(event) => handleLimitChange(event.target.value)}
                  fullWidth
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button variant="outlined" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="contained" onClick={() => handlePageChange(page + 1)}>
                    Next
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={1} sx={{ p: 2, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Selected type
                  </Typography>
                  <Typography>{selectedType}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Loaded notifications
                  </Typography>
                  <Typography>{notifications.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Unread / Viewed
                  </Typography>
                  <Typography>{unreadCount} unread</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {error && <Alert severity="error">{error}</Alert>}

          {authToken ? (
            <Stack spacing={3}>
              <Card elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Typography variant="h6">Priority Notifications</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Top priority alerts sorted by most recent timestamp.
                      </Typography>
                    </div>
                    <Button variant="outlined" onClick={markAllViewed} disabled={!notifications.length}>
                      Mark all viewed
                    </Button>
                  </Stack>

                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', mt: 2 }}>
                    {priorityNotifications.length ? (
                      priorityNotifications.map((notification) => (
                        <NotificationCard
                          key={`priority-${notification.ID}`}
                          notification={notification}
                          isNew={!viewedIds.has(notification.ID)}
                          onView={handleViewNotification}
                        />
                      ))
                    ) : (
                      <Typography color="text.secondary">No priority notifications available.</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notifications List
                  </Typography>
                  {loading ? (
                    <Stack sx={{ py: 4, alignItems: 'center' }}>
                      <CircularProgress />
                    </Stack>
                  ) : notifications.length ? (
                    <Stack spacing={2}>
                      {notifications.map((notification) => (
                        <NotificationCard
                          key={notification.ID}
                          notification={notification}
                          isNew={!viewedIds.has(notification.ID)}
                          onView={handleViewNotification}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary" sx={{ pt: 2 }}>
                      No notifications found. Change page, type, or limit to refresh the feed.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Card elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6">Authentication Required</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Register and authenticate first to view protected notification data from the API.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
