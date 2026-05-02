"use client";

import { Chip, Card, CardContent, Typography, Stack } from '@mui/material';
import type { NotificationItem } from '@/lib/api';

interface Props {
  notification: NotificationItem;
  isNew: boolean;
  onView: (id: string) => void;
}

export default function NotificationCard({ notification, isNew, onView }: Props) {
  return (
    <Card
      variant="outlined"
      onClick={() => onView(notification.ID)}
      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Typography variant="subtitle2" color="text.secondary">
              {notification.Type}
            </Typography>
            <Typography variant="h6" component="div" sx={{ mt: 1 }}>
              {notification.Message}
            </Typography>
          </div>
          {isNew && <Chip label="New" color="secondary" size="small" />}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {new Date(notification.Timestamp).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}
