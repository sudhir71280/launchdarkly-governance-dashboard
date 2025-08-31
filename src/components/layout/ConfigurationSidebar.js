import React, { useState } from 'react';
// ---------------------------------------------
// ConfigurationSidebar: Sidebar for dashboard settings and filters
// ---------------------------------------------
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Switch,
  Slider,
  Chip,
  Button,
  Divider,
  IconButton,
  FormGroup,
  Checkbox,
  Paper,
  Alert,
} from '@mui/material';
import { launchdarklyConfig } from '../../config/launchdarklyConfig';
import {
  Close,
  Save,
  Settings,
} from '@mui/icons-material';

const ConfigurationSidebar = ({ config, onConfigChange, onClose }) => {
  // Local state for form values and errors
  const [localConfig, setLocalConfig] = useState(config);
  const [errors, setErrors] = useState({});

  const handleSave = () => {
  // Validate and save configuration
    const newErrors = {};
    
    if (!localConfig.apiToken.trim()) {
      newErrors.apiToken = 'API Token is required';
    }
    
    if (!localConfig.projectKey.trim()) {
      newErrors.projectKey = 'Project Key is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onConfigChange(localConfig);
    onClose();
  };

  const handleFlagTypeChange = (flagType) => {
  // Toggle flag type filter
    const updatedTypes = localConfig.flagTypes.includes(flagType)
      ? localConfig.flagTypes.filter(type => type !== flagType)
      : [...localConfig.flagTypes, flagType];
    
    setLocalConfig({
      ...localConfig,
      flagTypes: updatedTypes,
    });
  };

  const handleLifecycleStageChange = (stage) => {
  // Toggle lifecycle stage filter
    const updatedStages = localConfig.lifecycleStages.includes(stage)
      ? localConfig.lifecycleStages.filter(s => s !== stage)
      : [...localConfig.lifecycleStages, stage];
    
    setLocalConfig({
      ...localConfig,
      lifecycleStages: updatedStages,
    });
  };

  const flagTypeOptions = ['boolean', 'string', 'number', 'json'];
  const lifecycleStageOptions = ['Live', 'Ready for Review', 'Ready to Archive', 'Permanent', 'Archived'];

  return (
  // Render sidebar UI for configuration and filters
    <Box sx={{ width: 400, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 1 }} />
          <Typography variant="h6">Configuration</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* API Configuration */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          LaunchDarkly API
        </Typography>
        <FormControl fullWidth margin="normal" size="small" error={!!errors.apiToken}>
          <Typography variant="body2" sx={{ mb: 1 }}>API Token</Typography>
          <Select
            value={localConfig.apiToken}
            onChange={(e) => setLocalConfig({ ...localConfig, apiToken: e.target.value })}
            displayEmpty
          >
            <MenuItem value=""><em>Select API Token</em></MenuItem>
            {launchdarklyConfig.apiTokens.map(token => (
              <MenuItem key={token.value} value={token.value}>{token.label}</MenuItem>
            ))}
          </Select>
          {errors.apiToken && (
            <Typography color="error" variant="caption">{errors.apiToken}</Typography>
          )}
          {!errors.apiToken && (
            <Typography variant="caption">Choose your LaunchDarkly API token</Typography>
          )}
        </FormControl>
        
  <FormControl fullWidth margin="normal" size="small" error={!!errors.projectKey}>
          <Typography variant="body2" sx={{ mb: 1 }}>Project Key</Typography>
          <Select
            value={localConfig.projectKey}
            onChange={(e) => setLocalConfig({ ...localConfig, projectKey: e.target.value })}
            displayEmpty
          >
            <MenuItem value=""><em>Select Project Key</em></MenuItem>
            {launchdarklyConfig.projectKeys.map(project => (
              <MenuItem key={project.value} value={project.value}>{project.label}</MenuItem>
            ))}
          </Select>
          {errors.projectKey && (
            <Typography color="error" variant="caption">{errors.projectKey}</Typography>
          )}
          {!errors.projectKey && (
            <Typography variant="caption">Choose your LaunchDarkly project key</Typography>
          )}
        </FormControl>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Filters
        </Typography>
        
        <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
          Minimum Age: {localConfig.ageFilter} days
        </Typography>
        <Slider
          value={localConfig.ageFilter}
          onChange={(e, value) => setLocalConfig({ ...localConfig, ageFilter: value })}
          min={0}
          max={365}
          step={1}
          marks={[
            { value: 0, label: '0' },
            { value: 30, label: '30' },
            { value: 90, label: '90' },
            { value: 180, label: '180' },
            { value: 365, label: '365' },
          ]}
          size="small"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={localConfig.includeArchived}
              onChange={(e) => setLocalConfig({ ...localConfig, includeArchived: e.target.checked })}
            />
          }
          label="Include Archived Flags"
          sx={{ mt: 2 }}
        />

        <Typography variant="body2" sx={{ mt: 3, mb: 1 }}>
          Flag Types
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {flagTypeOptions.map(type => (
            <Chip
              key={type}
              label={type}
              onClick={() => handleFlagTypeChange(type)}
              color={localConfig.flagTypes.includes(type) ? 'primary' : 'default'}
              variant={localConfig.flagTypes.includes(type) ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>

        <Typography variant="body2" sx={{ mt: 3, mb: 1 }}>
          Lifecycle Stages
        </Typography>
        <FormGroup>
          {lifecycleStageOptions.map(stage => (
            <FormControlLabel
              key={stage}
              control={
                <Checkbox
                  checked={localConfig.lifecycleStages.includes(stage)}
                  onChange={() => handleLifecycleStageChange(stage)}
                  size="small"
                />
              }
              label={stage}
            />
          ))}
        </FormGroup>
      </Paper>

      {/* Help */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Getting Started:</strong><br />
          1. Get your API token from LaunchDarkly: Account Settings → Authorization → Tokens<br />
          2. Find your project key in: Account Settings → Projects
        </Typography>
      </Alert>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleSave} startIcon={<Save />} fullWidth>
          Save Configuration
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigurationSidebar;
