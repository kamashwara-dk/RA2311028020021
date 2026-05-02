"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { NotificationType, RegisterRequest } from '@/lib/api';
import { authenticateUser, registerUser } from '@/lib/api';

const initialForm: RegisterRequest = {
  email: '',
  name: '',
  mobileNo: '',
  githubUsername: '',
  rollNo: '',
  accessCode: '',
};

const notificationTypes: Array<NotificationType | 'All'> = ['All', 'Event', 'Result', 'Placement'];

interface Props {
  onAuthSuccess: (token: string, type: NotificationType | 'All') => void;
  onTypeChange?: (type: NotificationType | 'All') => void;
  defaultType: NotificationType | 'All';
}

export default function AuthPanel({ onAuthSuccess, onTypeChange, defaultType }: Props) {
  const [form, setForm] = useState(initialForm);
  const [token, setToken] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem('notificationAppAccessToken') || '';
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | 'All'>(() => {
    if (typeof window === 'undefined') {
      return defaultType;
    }
    return (window.localStorage.getItem('notificationAppType') as NotificationType | 'All') || defaultType;
  });
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    if (token) {
      onAuthSuccess(token, selectedType);
    }
  }, [token, selectedType, onAuthSuccess]);

  const canSubmit = useMemo(
    () =>
      form.email.trim() &&
      form.name.trim() &&
      form.rollNo.trim() &&
      form.accessCode.trim() &&
      form.githubUsername.trim() &&
      form.mobileNo.trim(),
    [form]
  );

  const handleChange = (field: keyof RegisterRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    const nextValue = event.target.value as NotificationType | 'All';
    setSelectedType(nextValue);
    window.localStorage.setItem('notificationAppType', nextValue);
    onTypeChange?.(nextValue);
  };

  const copyToken = async () => {
    if (!token) {
      return;
    }
    await navigator.clipboard.writeText(token);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const registered = await registerUser(form);
      const authPayload = {
        email: form.email,
        name: form.name,
        rollNo: form.rollNo,
        accessCode: form.accessCode,
        clientID: registered.email || form.email,
        clientSecret: form.accessCode,
      };
      const authResponse = await authenticateUser(authPayload);
      window.localStorage.setItem('notificationAppAccessToken', authResponse.access_token);
      setToken(authResponse.access_token);
      onAuthSuccess(authResponse.access_token, selectedType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={2} sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Registration and Auth
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Register a user and obtain an access token for protected notification endpoints.
        </Typography>
        <Box sx={{ mt: 1, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <TextField label="Email" value={form.email} onChange={handleChange('email')} fullWidth />
          <TextField label="Name" value={form.name} onChange={handleChange('name')} fullWidth />
          <TextField label="Mobile Number" value={form.mobileNo} onChange={handleChange('mobileNo')} fullWidth />
          <TextField label="GitHub Username" value={form.githubUsername} onChange={handleChange('githubUsername')} fullWidth />
          <TextField label="Roll Number" value={form.rollNo} onChange={handleChange('rollNo')} fullWidth />
          <TextField label="Access Code" value={form.accessCode} onChange={handleChange('accessCode')} fullWidth />
          <Box>
            <Select value={selectedType} fullWidth onChange={handleTypeChange}>
              {notificationTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </Box>
          {token && (
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
              <TextField
                label="Access Token"
                value={token}
                type={showToken ? 'text' : 'password'}
                fullWidth
              />
              <Stack direction="row" spacing={1}>
                <IconButton
                  onClick={() => setShowToken((current) => !current)}
                  aria-label={showToken ? 'hide token' : 'show token'}
                  size="small"
                >
                  {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
                <IconButton onClick={copyToken} aria-label="copy token" size="small">
                  <ContentCopyIcon />
                </IconButton>
              </Stack>
            </Box>
          )}
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {token ? 'Re-authenticate' : 'Register & Authenticate'}
            </Button>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </CardContent>
    </Card>
  );
}
