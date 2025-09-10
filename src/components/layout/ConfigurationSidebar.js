import React, { useState, useEffect } from 'react';
// ---------------------------------------------
// ConfigurationSidebar: Sidebar for dashboard settings and filters
// ---------------------------------------------
import { Box, Typography, Select, MenuItem, FormControl, Button, IconButton, Paper, Switch, FormControlLabel } from '@mui/material';
import { launchdarklyConfig } from '../../config/launchdarklyConfig';
import LaunchDarklyService from '../../services/LaunchDarklyService';
// Add environments to launchdarklyConfig if not present
import { Close, Save, Settings, } from '@mui/icons-material';

const ConfigurationSidebar = ({ config, onConfigChange, onClose }) => {
  // Local state for form values and errors
  const [localConfig, setLocalConfig] = useState({
    ...config,
    apiToken: config.apiToken || 'api-8a9c5d7c-2557-46a4-bb8c-5732643a2f4c',
    projectKey: config.projectKey || '',
    includeArchived: config.includeArchived !== undefined ? config.includeArchived : launchdarklyConfig.includeArchived,
  });

  // Persist includeArchived to localStorage when it changes
  useEffect(() => {
    if (localConfig.includeArchived !== undefined) {
      localStorage.setItem('includeArchived', JSON.stringify(localConfig.includeArchived));
    }
  }, [localConfig.includeArchived]);
  const [errors, setErrors] = useState({});

  const [projectOptions, setProjectOptions] = useState(launchdarklyConfig.projectKeys || []);
  // Fetch projects from LaunchDarkly API when sidebar mounts or apiToken changes
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const service = new LaunchDarklyService(localConfig.apiToken);
        const projects = await service.fetchProjects();
        // Map to { label, value } for dropdown
        const options = projects.map(p => ({ label: p.name, value: p.key }));
        setProjectOptions(options);
        // If current projectKey is not in options, reset to blank or first available
        if (localConfig.projectKey && !options.some(opt => opt.value === localConfig.projectKey)) {
          setLocalConfig(lc => ({ ...lc, projectKey: options.length > 0 ? options[0].value : '' }));
        }
      } catch (err) {
        // fallback to config if API fails
        setProjectOptions(launchdarklyConfig.projectKeys || []);
        if (localConfig.projectKey && !(launchdarklyConfig.projectKeys || []).some(opt => opt.value === localConfig.projectKey)) {
          setLocalConfig(lc => ({ ...lc, projectKey: '' }));
        }
      }
    };
    fetchProjects();
  }, [localConfig.apiToken, localConfig.projectKey]);

  const handleSave = () => {
    // Validate and save configuration
    const newErrors = {};
    if (!localConfig.apiToken || !localConfig.apiToken.trim()) {
      newErrors.apiToken = 'API Token is required';
    }
    if (!localConfig.projectKey || !localConfig.projectKey.trim()) {
      newErrors.projectKey = 'Project Key is required';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    setErrors({});
    onConfigChange(localConfig);
    onClose();
  };
  return (
    <Box sx={{ width: 400, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 1 }} />
          <Typography variant="h6">Configuration</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>
      {/* API Configuration */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth margin="normal" size="small" sx={{ disabled: 'disabled' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Provider Key</Typography>
          <Select
            value={localConfig.apiToken}
            onChange={(e) => setLocalConfig({ ...localConfig, apiToken: e.target.value })}
            displayEmpty
            disabled
          >
            {launchdarklyConfig.apiTokens.map(token => (
              <MenuItem key={token.value} value={token.value}>{token.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" size="small" error={!!errors.projectKey}>
          <Typography variant="body2" sx={{ mb: 1 }}>Project Key</Typography>
          <Select
            value={localConfig.projectKey}
            onChange={(e) => setLocalConfig({ ...localConfig, projectKey: e.target.value })}
            displayEmpty
          >
            <MenuItem value=""><em>Select Project Key</em></MenuItem>
            {projectOptions.map(project => (
              <MenuItem key={project.value} value={project.value}>{project.label}</MenuItem>
            ))}
          </Select>
          {errors.projectKey && (
            <Typography color="error" variant="caption">{errors.projectKey}</Typography>
          )}
          {!errors.projectKey && (!localConfig.projectKey || localConfig.projectKey.trim() === "") && (
            <Typography variant="caption" color="error">Choose your LaunchDarkly project key</Typography>
          )}
        </FormControl>
      </Paper>
      {/* Include Archived Toggle */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={!!localConfig.includeArchived}
              onChange={e => setLocalConfig({ ...localConfig, includeArchived: e.target.checked })}
              color="primary"
            />
          }
          label="Include Archived Flags"
        />
      </Paper>
      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<Save />}
          fullWidth
          disabled={!localConfig.projectKey || localConfig.projectKey.trim() === ""}
        >
          Save Configuration
        </Button>
      </Box>
    </Box>
  );
}

export default ConfigurationSidebar;
