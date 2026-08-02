// SetupProfileManagement.js
// Manages Setup Profiles via BFF API: create, update, and list in a grid.

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, CircularProgress, Alert, Chip, Tooltip,
  Divider, InputAdornment,
} from '@mui/material';
import {
  Add, Edit, Refresh, Save, Cancel, Person, Search, Clear,
} from '@mui/icons-material';

// In local dev, requests go through the CRA dev proxy (src/setupProxy.js) to
// avoid browser CORS restrictions. In production, APIM is called directly,
// which requires APIM's CORS policy to allow the deployed app's origin.
const BASE_URL = process.env.NODE_ENV === 'development'
  ? '/apim-proxy'
  : 'https://cnh-we-mkt-vms-apim-01.azure-api.net';

const apimClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json-patch+json',
    'Ocp-Apim-Subscription-Key': 'adb4a952c3fd4cd29210d087717cfad8',
  },
});

// Calls CreateUpdateSetupProfile with the given payload.
// Passing EMPTY_FORM returns the full list of setup profiles.
const callCreateUpdateSetupProfile = (payload) =>
  apimClient.post('/bff/dev/b2c/v1.0/Configurations/CreateUpdateSetupProfile', payload);

const EMPTY_FORM = {
  RowKey: '',
  Name: '',
  ActiveDirectoryID: '',
  Status: true,
  CreatedBy: '',
  ModifiedBy: '',
  Owner: '',
};

// ---------------------------------------------------------------------------
// Memoized row list. Opening/closing the edit dialog only changes dialog and
// form state on the parent, which would otherwise re-render and re-diff all
// profile rows on every open/close. Memoizing keeps that re-render limited
// to when `profiles`, `loading`, or `onEdit` actually change.
// ---------------------------------------------------------------------------
const ProfilesTableBody = memo(function ProfilesTableBody({ profiles, loading, onEdit, emptyMessage }) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading profiles…
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  if (profiles.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  return profiles.map((profile, idx) => {
    const isActive = profile.profileStatus === 'Active';
    return (
    <TableRow
      key={profile.id || idx}
      hover
      sx={{
        backgroundColor: isActive ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.16)',
        '&:hover': { backgroundColor: isActive ? 'rgba(46, 125, 50, 0.16)' : 'rgba(211, 47, 47, 0.24)' },
      }}
    >
      <TableCell sx={{ fontWeight: 600 }}>{profile.name}</TableCell>
      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
        {profile.activeDirectoryID}
      </TableCell>
      <TableCell>
        <Chip
          label={profile.profileStatus}
          size="small"
          color={profile.profileStatus === 'Active' ? 'success' : 'default'}
          sx={{ fontWeight: 600 }}
        />
      </TableCell>
      <TableCell>{profile.createdBy}</TableCell>
      <TableCell>{profile.modifiedBy}</TableCell>
      <TableCell>{profile.owner}</TableCell>
      <TableCell>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            color="primary"
            onClick={() => onEdit(profile)}
            sx={{ border: '1px solid #1976d2' }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
    );
  });
});

// ---------------------------------------------------------------------------
// SetupProfileManagement Component
// ---------------------------------------------------------------------------
const SetupProfileManagement = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  // Form dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  // ------------------------------------------------------------------
  // API calls
  // ------------------------------------------------------------------
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Calling with the empty form payload returns all setup profiles
      const response = await callCreateUpdateSetupProfile(EMPTY_FORM);
      const data = response.data;
      const list = data?.setupProfiles ?? (Array.isArray(data) ? data : []);
      setProfiles(list);
    } catch (err) {
      setError(`Failed to load profiles: ${err.response?.data?.message || err.response?.statusText || err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Defer the expensive filter/re-render until typing pauses briefly, so
  // keystrokes in the search box stay responsive even with large lists.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 200);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await callCreateUpdateSetupProfile(formData);
      setSuccess(isEditMode ? 'Profile updated successfully.' : 'Profile created successfully.');
      setDialogOpen(false);
      await fetchProfiles();
    } catch (err) {
      setError(`Failed to save profile: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------------
  // Form helpers
  // ------------------------------------------------------------------
  const validateForm = () => {
    const errors = {};
    if (!formData.Name.trim()) errors.Name = 'Name is required.';
    if (!formData.ActiveDirectoryID.trim()) errors.ActiveDirectoryID = 'Active Directory ID is required.';
    if (!formData.Owner.trim()) errors.Owner = 'Owner is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsEditMode(false);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((profile) => {
    setFormData({
      RowKey: profile.id || '',
      Name: profile.name || '',
      ActiveDirectoryID: profile.activeDirectoryID || '',
      Status: profile.profileStatus === 'Active',
      CreatedBy: profile.createdBy || '',
      ModifiedBy: profile.modifiedBy || '',
      Owner: profile.owner || '',
    });
    setFormErrors({});
    setIsEditMode(true);
    setDialogOpen(true);
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Free-text search across all visible profile fields, with Active
  // profiles sorted to the top by default.
  const filteredProfiles = useMemo(() => {
    const query = debouncedSearchText.trim().toLowerCase();
    const matches = !query ? profiles : profiles.filter((profile) => (
      [profile.name, profile.activeDirectoryID, profile.profileStatus, profile.createdBy, profile.modifiedBy, profile.owner]
        .some((field) => field?.toLowerCase().includes(query))
    ));
    return [...matches].sort((a, b) => {
      const aActive = a.profileStatus === 'Active' ? 0 : 1;
      const bActive = b.profileStatus === 'Active' ? 0 : 1;
      return aActive - bActive;
    });
  }, [profiles, debouncedSearchText]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Box>
      {/* Toolbar: search, refresh, add */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TextField
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search profiles by name, AD ID, status, owner…"
          size="medium"
          fullWidth
          sx={{ backgroundColor: '#fff' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: searchText && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchText('')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="Refresh">
          <span>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
              onClick={fetchProfiles}
              disabled={loading}
              sx={{ fontWeight: 600, whiteSpace: 'nowrap', height: 56 }}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
          sx={{
            fontWeight: 700,
            whiteSpace: 'nowrap',
            height: 56,
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            '&:hover': { background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)' },
          }}
        >
          Add Profile
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Profiles Grid */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' }}>
              {['Name', 'Active Directory ID', 'Status', 'Created By', 'Modified By', 'Owner', 'Actions'].map((header) => (
                <TableCell
                  key={header}
                  sx={{ color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <ProfilesTableBody
              profiles={filteredProfiles}
              loading={loading}
              onEdit={openEditDialog}
              emptyMessage={debouncedSearchText ? 'No profiles match your search.' : 'No profiles found. Click "Add Profile" to create one.'}
            />
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total count */}
      {!loading && profiles.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'right' }}>
          {debouncedSearchText
            ? `${filteredProfiles.length} of ${profiles.length} profile${profiles.length !== 1 ? 's' : ''} matched`
            : `${profiles.length} profile${profiles.length !== 1 ? 's' : ''} found`}
        </Typography>
      )}

      {/* ----------------------------------------------------------------
          Create / Edit Dialog
      ---------------------------------------------------------------- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person color="primary" />
          {isEditMode ? 'Edit Setup Profile' : 'Create Setup Profile'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.Name}
              onChange={(e) => handleFieldChange('Name', e.target.value)}
              fullWidth
              required
              error={Boolean(formErrors.Name)}
              helperText={formErrors.Name}
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              label="Active Directory ID"
              value={formData.ActiveDirectoryID}
              onChange={(e) => handleFieldChange('ActiveDirectoryID', e.target.value)}
              fullWidth
              required
              error={Boolean(formErrors.ActiveDirectoryID)}
              helperText={formErrors.ActiveDirectoryID}
              inputProps={{ maxLength: 200 }}
              placeholder="e.g. abc123@cnh1.cnhgroup.cnh.com"
            />
            <TextField
              label="Owner"
              value={formData.Owner}
              onChange={(e) => handleFieldChange('Owner', e.target.value)}
              fullWidth
              required
              error={Boolean(formErrors.Owner)}
              helperText={formErrors.Owner}
              inputProps={{ maxLength: 100 }}
            />
            {isEditMode ? (
              <TextField
                label="Modified By"
                value={formData.ModifiedBy}
                onChange={(e) => handleFieldChange('ModifiedBy', e.target.value)}
                fullWidth
                inputProps={{ maxLength: 100 }}
              />
            ) : (
              <TextField
                label="Created By"
                value={formData.CreatedBy}
                onChange={(e) => handleFieldChange('CreatedBy', e.target.value)}
                fullWidth
                inputProps={{ maxLength: 100 }}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.Status}
                  onChange={(e) => handleFieldChange('Status', e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography fontWeight={600}>
                  Status: {formData.Status ? 'Active' : 'Inactive'}
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            startIcon={<Cancel />}
            disabled={saving}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            disabled={saving}
            variant="contained"
            sx={{ fontWeight: 700 }}
          >
            {saving ? 'Saving…' : isEditMode ? 'Update Profile' : 'Create Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SetupProfileManagement;
