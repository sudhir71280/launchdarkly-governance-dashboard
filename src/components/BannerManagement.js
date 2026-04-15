import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Switch, Paper,
  Grid, Alert, CircularProgress, Chip, Divider, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
} from '@mui/material';
import {
  Save, CheckCircle, Cancel,
  ToggleOn, Visibility, Warning,
} from '@mui/icons-material';

const FLAG_KEY = 'VMS-DowntimeInformation';

const DEFAULT_ON_VALUE = {
  message: { countryenabled: '', message: '', title: 'Operational Delay: ' },
  status: true,
};
const DEFAULT_OFF_VALUE = {
  message: { countryenabled: '', message: '', title: 'Planned Maintinance: ' },
  status: false,
};

const BannerManagement = ({ launchDarklyService, config }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [flagData, setFlagData] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [confirmToggle, setConfirmToggle] = useState(null); // { envKey, turnOn } when awaiting confirmation

  // Editable form state
  const [onVariation, setOnVariation] = useState(DEFAULT_ON_VALUE);
  const [offVariation, setOffVariation] = useState(DEFAULT_OFF_VALUE);

  // Load flag data and environments
  const loadFlagData = useCallback(async () => {
    if (!config.apiToken || !config.projectKey) return;
    setLoading(true);
    setError('');
    try {
      const [flag, envs] = await Promise.all([
        launchDarklyService.getFlagDetails(FLAG_KEY),
        launchDarklyService.fetchEnvironments(),
      ]);
      setFlagData(flag);
      setEnvironments(envs);

      if (flag.variations && flag.variations.length >= 2) {
        const onVal = typeof flag.variations[0].value === 'string'
          ? JSON.parse(flag.variations[0].value) : flag.variations[0].value;
        const offVal = typeof flag.variations[1].value === 'string'
          ? JSON.parse(flag.variations[1].value) : flag.variations[1].value;
        setOnVariation(onVal || DEFAULT_ON_VALUE);
        setOffVariation(offVal || DEFAULT_OFF_VALUE);
      }
    } catch (err) {
      setError(`Unable to load banner data. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [launchDarklyService, config.apiToken, config.projectKey]);

  useEffect(() => { loadFlagData(); }, [loadFlagData]);

  const isFlagOnInEnv = (envKey) => {
    if (!flagData?.environments) return false;
    return flagData.environments[envKey]?.on || false;
  };

  // Handle variation field changes
  const handleOnChange = (field, value) => {
    setOnVariation(prev => ({ ...prev, message: { ...prev.message, [field]: value } }));
  };
  const handleOffChange = (field, value) => {
    setOffVariation(prev => ({ ...prev, message: { ...prev.message, [field]: value } }));
  };

  // Save variation values
  const handleSaveVariations = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await launchDarklyService.updateFlagVariationValue(FLAG_KEY, 0, onVariation);
      await launchDarklyService.updateFlagVariationValue(FLAG_KEY, 1, offVariation);
      setSuccess('Banner message updated successfully!');
      await loadFlagData();
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Environment color mapping based on name/key
  const getEnvColor = (envKey) => {
    const key = envKey.toLowerCase();
    if (key.includes('prod')) return { border: '#d32f2f', bg: '#ffebee', bgOn: '#ffcdd2', chip: 'error', label: '#c62828' };
    if (key.includes('marketing')) return { border: '#d32f2f', bg: '#ffebee', bgOn: '#ffcdd2', chip: 'error', label: '#c62828' };
    if (key.includes('stag') || key.includes('uat')) return { border: '#ed6c02', bg: '#fff3e0', bgOn: '#ffe0b2', chip: 'warning', label: '#e65100' };
    if (key.includes('test') || key.includes('qa')) return { border: '#0288d1', bg: '#e1f5fe', bgOn: '#b3e5fc', chip: 'info', label: '#01579b' };
    if (key.includes('dev')) return { border: '#2e7d32', bg: '#e8f5e9', bgOn: '#c8e6c9', chip: 'success', label: '#1b5e20' };
    return { border: '#757575', bg: '#fafafa', bgOn: '#e0e0e0', chip: 'default', label: '#424242' };
  };

  const isProductionEnv = (envKey) => envKey.toLowerCase().includes('prod');
  const isMarketingEnv = (envKey) => envKey.toLowerCase().includes('marketing');

  // Toggle flag in a specific environment
  const handleToggle = async (envKey, turnOn) => {
    setToggling(prev => ({ ...prev, [envKey]: true }));
    setError('');
    setSuccess('');
    try {
      await launchDarklyService.toggleFlagInEnvironment(FLAG_KEY, envKey, turnOn);
      setSuccess(`Flag ${turnOn ? 'enabled' : 'disabled'} in "${envKey}" successfully!`);
      await loadFlagData();
    } catch (err) {
      setError(`Failed to toggle in ${envKey}: ${err.message}`);
    } finally {
      setToggling(prev => ({ ...prev, [envKey]: false }));
    }
  };

  // Guarded toggle — asks confirmation for production and marketing
  const requestToggle = (envKey, turnOn) => {
    setConfirmToggle({ envKey, turnOn });
  };

  if (!config.apiToken || !config.projectKey) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Please configure your LaunchDarkly API credentials first.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Current Active Banner from LaunchDarkly */}
      {!loading && flagData && (
        <Paper elevation={3} sx={{ mb: 3, overflow: 'hidden', border: '2px solid #1976d2' }}>
          <Box sx={{ bgcolor: '#1976d2', color: '#fff', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility sx={{ fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Current Active Banner in LaunchDarkly (Manage the VMS Downtime Information banner across environments) 
            </Typography>
            <Chip
              label={`Flag: ${FLAG_KEY}`}
              size="small"
              sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ p: 3 }}>
            {/* Active environments summary */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mr: 1 }}>Enabled in:</Typography>
              {environments.filter(env => isFlagOnInEnv(env.key)).length > 0
                ? environments.filter(env => isFlagOnInEnv(env.key)).map(env => (
                    <Chip key={env.key} label={env.name || env.key} color="success" size="small" sx={{ fontWeight: 600 }} />
                  ))
                : <Chip label="No environments — banner is OFF everywhere" color="default" size="small" />
              }
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {/* Live ON value */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #4caf50', bgcolor: '#f1f8e9', height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                    <CheckCircle sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    Flag ON Value (Live)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#e65100', mb: 0.5 }}>
                    {flagData.variations?.[0]?.value?.message?.title || onVariation.message?.title || '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333', whiteSpace: 'pre-wrap' }}>
                    {flagData.variations?.[0]?.value?.message?.message || onVariation.message?.message || 'No message set'}
                  </Typography>
                  {(flagData.variations?.[0]?.value?.message?.countryenabled) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Country: {flagData.variations?.[0]?.value?.message?.countryenabled || 'All'}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              {/* Live OFF value */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #f44336', bgcolor: '#fce4ec', height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f44336', mb: 1 }}>
                    <Cancel sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    Flag OFF Value (Live)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#b71c1c', mb: 0.5 }}>
                    {flagData.variations?.[1]?.value?.message?.title || offVariation.message?.title || '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333', whiteSpace: 'pre-wrap' }}>
                    {flagData.variations?.[1]?.value?.message?.message || offVariation.message?.message || 'No message set'}
                  </Typography>
                  {(flagData.variations?.[1]?.value?.message?.countryenabled) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Country: {flagData.variations?.[1]?.value?.message?.countryenabled || 'All'}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Section: Environment Controls */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ overflow: 'hidden', border: '2px solid #ed6c02' }}>
              <Box sx={{ bgcolor: '#ed6c02', color: '#fff', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ToggleOn sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Environment Controls — Show or Hide the Banner per Environment
                </Typography>
                <Chip
                  label="Changes take effect immediately"
                  size="small"
                  sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                />
              </Box>
              <Box sx={{ p: 2, bgcolor: '#fff3e0' }}>
                <Typography variant="body2" color="text.secondary">
                  Toggle the banner flag on or off for each environment. When <b>ON</b>, the "Flag ON" banner message will be shown to users in that environment.
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  {environments.map((env) => {
                    const isOn = isFlagOnInEnv(env.key);
                    const isToggling = toggling[env.key];
                    const colors = getEnvColor(env.key);
                    const isProd = isProductionEnv(env.key);
                    const isMktg = isMarketingEnv(env.key);
                    const sensitive = isProd || isMktg;
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={env.key}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                            borderColor: isOn ? colors.border : '#bdbdbd', borderWidth: 2,
                            bgcolor: isOn ? colors.bgOn : colors.bg, transition: 'all 0.2s',
                            ...(sensitive && { boxShadow: isOn ? '0 0 8px rgba(211,47,47,0.35)' : 'none' }),
                          }}
                        >
                          {isProd && (
                            <Chip
                              icon={<Warning sx={{ fontSize: 16 }} />}
                              label="PRODUCTION"
                              size="small"
                              color="error"
                              sx={{ fontWeight: 700, fontSize: 11, mb: 0.5 }}
                            />
                          )}
                          {isMktg && (
                            <Chip
                              icon={<Warning sx={{ fontSize: 16 }} />}
                              label="MARKETING"
                              size="small"
                              color="error"
                              sx={{ fontWeight: 700, fontSize: 11, mb: 0.5 }}
                            />
                          )}
                          {!sensitive && (
                            <Chip
                              label={env.name || env.key}
                              color={isOn ? colors.chip : 'default'}
                              variant={isOn ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 600, fontSize: 14 }}
                            />
                          )}
                          <Typography variant="caption" sx={{ color: colors.label }}>{env.key}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: isOn ? colors.border : 'text.secondary', fontWeight: isOn ? 600 : 400 }}>
                              {isOn ? 'Banner ON' : 'Banner OFF'}
                            </Typography>
                            {isToggling ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch checked={isOn} onChange={() => requestToggle(env.key, !isOn)} color={sensitive ? 'error' : 'success'} />
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                  {environments.length === 0 && (
                    <Grid item xs={12}>
                      <Alert severity="info">No environments found for this project.</Alert>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Section: Edit Banner Variations */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ overflow: 'hidden', border: '2px solid #2e7d32' }}>
              <Box sx={{ bgcolor: '#2e7d32', color: '#fff', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Save sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Edit Banner Variations — Update the Flag ON &amp; Flag OFF Messages
                </Typography>
                <Chip
                  label="Changes apply after Save"
                  size="small"
                  sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                />
              </Box>
              <Box sx={{ p: 2, bgcolor: '#f1f8e9' }}>
                <Typography variant="body2" color="text.secondary">
                  Edit the banner title, message, country filter and status for each variation below. Click <b>Save Banner Messages</b> to push changes to LaunchDarkly.
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Flag ON Variation */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ borderTop: '4px solid #4caf50', height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <CheckCircle sx={{ color: '#4caf50' }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#4caf50' }}>
                            Flag ON — Active Banner
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          This message is shown when the flag is <b>enabled</b> in an environment.
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <TextField
                          fullWidth label="Banner Title"
                          value={onVariation.message?.title || ''}
                          onChange={(e) => handleOnChange('title', e.target.value)}
                          sx={{ mb: 2 }} variant="outlined" size="small"
                          placeholder='e.g. Operational Delay: '
                        />
                        <TextField
                          fullWidth label="Banner Message"
                          value={onVariation.message?.message || ''}
                          onChange={(e) => handleOnChange('message', e.target.value)}
                          sx={{ mb: 2 }} variant="outlined" multiline rows={4}
                          placeholder="Enter the banner message to display to users..."
                        />
                        <TextField
                          fullWidth label="Country Enabled (comma-separated or empty for all)"
                          value={onVariation.message?.countryenabled || ''}
                          onChange={(e) => handleOnChange('countryenabled', e.target.value)}
                          variant="outlined" size="small"
                          placeholder='e.g. US,UK or leave empty for all'
                        />
                        <FormControlLabel
                          control={
                            <Switch checked={!!onVariation.status}
                              onChange={(e) => setOnVariation(prev => ({ ...prev, status: e.target.checked }))}
                              color="success" />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Status: {onVariation.status ? 'true' : 'false'}</Typography>}
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Flag OFF Variation */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ borderTop: '4px solid #f44336', height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Cancel sx={{ color: '#f44336' }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f44336' }}>
                            Flag OFF — Default Banner
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          This message is used when the flag is <b>disabled</b> (fallback).
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <TextField
                          fullWidth label="Banner Title"
                          value={offVariation.message?.title || ''}
                          onChange={(e) => handleOffChange('title', e.target.value)}
                          sx={{ mb: 2 }} variant="outlined" size="small"
                          placeholder='e.g. Planned Maintenance: '
                        />
                        <TextField
                          fullWidth label="Banner Message"
                          value={offVariation.message?.message || ''}
                          onChange={(e) => handleOffChange('message', e.target.value)}
                          sx={{ mb: 2 }} variant="outlined" multiline rows={4}
                          placeholder="Enter the fallback banner message..."
                        />
                        <TextField
                          fullWidth label="Country Enabled (comma-separated or empty for all)"
                          value={offVariation.message?.countryenabled || ''}
                          onChange={(e) => handleOffChange('countryenabled', e.target.value)}
                          variant="outlined" size="small"
                          placeholder='e.g. US,UK or leave empty for all'
                        />
                        <FormControlLabel
                          control={
                            <Switch checked={!!offVariation.status}
                              onChange={(e) => setOffVariation(prev => ({ ...prev, status: e.target.checked }))}
                              color="error" />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Status: {offVariation.status ? 'true' : 'false'}</Typography>}
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Save Button */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained" size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    onClick={handleSaveVariations}
                    disabled={saving}
                    sx={{
                      px: 6, py: 1.5, fontWeight: 700, fontSize: 16,
                      background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
                      '&:hover': { background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)' },
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Banner Messages'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Sensitive Environment Toggle Confirmation Dialog */}
      <Dialog
        open={Boolean(confirmToggle)}
        onClose={() => setConfirmToggle(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <Warning color="error" /> Confirm Environment Change
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="error" sx={{ mb: 2 }}>
            You are about to {confirmToggle?.turnOn ? 'ENABLE' : 'DISABLE'} the banner in <b>{confirmToggle?.envKey}</b>.
          </Alert>
          <Typography variant="body2">
            {confirmToggle?.turnOn
              ? `Enabling the banner in ${confirmToggle?.envKey} will immediately display the downtime notification to all users in this environment.`
              : `Disabling the banner in ${confirmToggle?.envKey} will immediately hide the downtime notification from all users in this environment.`}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmToggle(null)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => {
              const { envKey, turnOn } = confirmToggle;
              setConfirmToggle(null);
              handleToggle(envKey, turnOn);
            }}
            variant="contained"
            color="error"
          >
            {confirmToggle?.turnOn ? `Enable in ${confirmToggle?.envKey}` : `Disable in ${confirmToggle?.envKey}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BannerManagement;