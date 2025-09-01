import React, { useState, useEffect } from 'react';
// ---------------------------------------------
// ConfigurationSidebar: Sidebar for dashboard settings and filters
// ---------------------------------------------
import {  Box,  Typography,  Select,  MenuItem,  FormControl,  FormControlLabel,  Switch,  Slider,  Chip,  Button,  IconButton,  FormGroup,  Checkbox,  Paper,  Alert,} from '@mui/material';
import { launchdarklyConfig } from '../../config/launchdarklyConfig';
import LaunchDarklyService from '../../services/LaunchDarklyService';
// Add environments to launchdarklyConfig if not present
import {  Close,  Save,  Settings,} from '@mui/icons-material';

const ConfigurationSidebar = ({ config, onConfigChange, onClose }) => {
  // Local state for form values and errors
  const [localConfig, setLocalConfig] = useState({
    ...config,
    environment: config.environment ?? '',
    apiToken: config.apiToken || 'api-8a9c5d7c-2557-46a4-bb8c-5732643a2f4c',
  });
  const [environmentOptions, setEnvironmentOptions] = useState(launchdarklyConfig.environments || []);
  const [errors, setErrors] = useState(() => {
    return (!config.environment || String(config.environment).trim() === '')
      ? { environment: 'Environment is required' }
      : {};
  });

  // Always validate environment on change and when environment options update
  useEffect(() => {
    if (!localConfig.environment || String(localConfig.environment).trim() === '') {
      setErrors(prev => ({ ...prev, environment: 'Environment is required' }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.environment;
        return newErrors;
      });
    }
  }, [localConfig.environment, environmentOptions]);
  const [projectOptions, setProjectOptions] = useState(launchdarklyConfig.projectKeys || []);
  // Fetch projects from LaunchDarkly API when sidebar mounts or apiToken changes
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const service = new LaunchDarklyService(localConfig.apiToken);
        const projects = await service.fetchProjects();
        // Map to { label, value } for dropdown
        setProjectOptions(projects.map(p => ({ label: p.name, value: p.key })));
      } catch (err) {
        // fallback to config if API fails
        setProjectOptions(launchdarklyConfig.projectKeys || []);
      }
    };
    fetchProjects();
  }, [localConfig.apiToken]);

  const handleSave = () => {
    // Validate and save configuration
    const newErrors = {};

    if (!localConfig.apiToken || !localConfig.apiToken.trim()) {
      newErrors.apiToken = 'API Token is required';
    }

    if (!localConfig.projectKey || !localConfig.projectKey.trim()) {
      newErrors.projectKey = 'Project Key is required';
    }

    // Environment must be a non-empty string
    if (!localConfig.environment || String(localConfig.environment).trim() === '') {
      newErrors.environment = 'Environment is required';
    }

    setErrors(newErrors); // Always set errors so alert persists
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Clear errors on successful save
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


  // Fetch environments for selected project when projectKey changes
  useEffect(() => {
    const fetchEnvironments = async () => {
      if (!localConfig.projectKey) {
        setEnvironmentOptions([]);
        return;
      }
      try {
        const service = new LaunchDarklyService(localConfig.apiToken, localConfig.projectKey);
        const response = await service.client.get(`/projects/${localConfig.projectKey}/environments`);
        const envs = response.data.items || [];
        setEnvironmentOptions(envs.map(e => ({ label: e.name, value: e.key })));
      } catch (err) {
        setEnvironmentOptions(launchdarklyConfig.environments || []);
      }
    };
    fetchEnvironments();
  }, [localConfig.apiToken, localConfig.projectKey]);

  return (
    // Render sidebar UI for configuration and filters
    <Box sx={{ width: 400, p: 3 }}>
      {/* Alert for environment not selected */}
      {errors.environment && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.environment}
        </Alert>
      )}
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
        {/* Hidden API Token selector, always set to LaunchDarkly */}
        <FormControl fullWidth margin="normal" size="small" sx={{ display: 'none' }}>
          <Select
            value={localConfig.apiToken}
            onChange={(e) => setLocalConfig({ ...localConfig, apiToken: e.target.value })}
            displayEmpty
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
          {!errors.projectKey && (
            <Typography variant="caption">Choose your LaunchDarkly project key</Typography>
          )}
        </FormControl>

        <FormControl fullWidth margin="normal" size="small" error={!!errors.environment}>
          <Typography variant="body2" sx={{ mb: 1 }}>Environment</Typography>
          <Select
            value={localConfig.environment || ''}
            onChange={(e) => {
              const value = e.target.value;
              setLocalConfig({ ...localConfig, environment: value });
              // Validation is handled by useEffect above
            }}
            displayEmpty
            renderValue={selected => {
              if (!selected || !environmentOptions.length) {
                return <em>Select Environment</em>;
              }
              const found = environmentOptions.find(env => env.value === selected);
              return found ? found.label : <em>Select Environment</em>;
            }}
          >
            <MenuItem value=""><em>Select Environment</em></MenuItem>
            {environmentOptions.map(env => (
              <MenuItem key={env.value} value={env.value}>{env.label}</MenuItem>
            ))}
          </Select>
          {errors.environment && (
            <Typography color="error" variant="caption">{errors.environment}</Typography>
          )}
          {!errors.environment && (
            <Typography variant="caption">Select the environment to fetch flags from</Typography>
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
          1. Get your API token from LaunchDarkly: <b>Account Settings → Authorization → Tokens</b><br />
          2. Select your <b>project key</b> from the dropdown.<br />
          3. Select your <b>environment key</b> from the dropdown.<br />
        </Typography>
      </Alert>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<Save />}
          fullWidth
          disabled={
            !localConfig.environment ||
            String(localConfig.environment).trim() === '' ||
            localConfig.environment === '' ||
            localConfig.environment === undefined ||
            !environmentOptions.some(env => env.value === localConfig.environment)
          }
        >
          Save Configuration
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigurationSidebar;
