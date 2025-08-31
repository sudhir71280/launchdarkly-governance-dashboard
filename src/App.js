import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Button,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import {
  Flag,
  Refresh,
  Menu,
  Download,
} from '@mui/icons-material';
import { SnackbarProvider, useSnackbar } from 'notistack';

// Import custom components
import MetricsCards from './components/MetricsCards';
import FlagLifecycleChart from './components/FlagLifecycleChart';
import AgeDistributionChart from './components/AgeDistributionChart';
import PriorityScatterChart from './components/PriorityScatterChart';
import TimelineChart from './components/TimelineChart';
import FlagTypesChart from './components/FlagTypesChart';
import CleanupRecommendationsTable from './components/CleanupRecommendationsTable';
import AlertsSection from './components/AlertsSection';
import ConfigurationSidebar from './components/ConfigurationSidebar';
import { LaunchDarklyService } from './services/LaunchDarklyService';

import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [flagsData, setFlagsData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [config, setConfig] = useState({
    apiToken: localStorage.getItem('launchdarkly_api_token') || '',
    projectKey: localStorage.getItem('launchdarkly_project_key') || '',
    ageFilter: 30,
    includeArchived: false,
    flagTypes: ['boolean', 'string', 'number', 'json'],
    lifecycleStages: ['Ready for Review', 'Ready to Archive'],
  });

  const { enqueueSnackbar } = useSnackbar();

  const launchDarklyService = new LaunchDarklyService(config.apiToken, config.projectKey);

  useEffect(() => {
    if (config.apiToken && config.projectKey) {
      loadData();
    }
  }, [config.apiToken, config.projectKey]);

  const loadData = async () => {
    if (!config.apiToken || !config.projectKey) {
      enqueueSnackbar('Please configure API credentials', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const data = await launchDarklyService.fetchFlags();
      const analyzedData = analyzeFlags(data.items || []);
      
      setFlagsData(analyzedData.flags);
      setMetrics(analyzedData.metrics);
      setAlerts(analyzedData.alerts);
      setLastUpdate(new Date());
      
      enqueueSnackbar('Data loaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error loading data:', error);
      enqueueSnackbar('Error loading data: ' + error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const analyzeFlags = (flags) => {
    const currentTime = new Date();
    const analyzedFlags = [];
    
    const metrics = {
      totalFlags: flags.length,
      temporaryFlags: 0,
      permanentFlags: 0,
      archivedFlags: 0,
      readyToArchive: 0,
      highPriority: 0,
      ageDistribution: { '0-30': 0, '31-90': 0, '91-180': 0, '180+': 0 },
      flagTypes: {},
      lifecycleStages: {},
      cleanupCandidates: [],
    };

    flags.forEach((flag) => {
      const creationDate = new Date(flag.creationDate);
      const ageDays = Math.floor((currentTime - creationDate) / (1000 * 60 * 60 * 24));
      const lifecycleStage = determineLifecycleStage(flag, ageDays);
      const priorityScore = calculatePriorityScore(flag, ageDays);
      const analyzedFlag = {
        ...flag,
        ageDays,
        creationDate,
        lifecycleStage,
        priorityScore,
      };
      analyzedFlags.push(analyzedFlag);

      // Metrics
      if (flag.archived) {
        metrics.archivedFlags++;
      } else {
        if (flag.temporary) metrics.temporaryFlags++;
        else metrics.permanentFlags++;

        // Age distribution
        if (ageDays <= 30) metrics.ageDistribution['0-30']++;
        else if (ageDays <= 90) metrics.ageDistribution['31-90']++;
        else if (ageDays <= 180) metrics.ageDistribution['91-180']++;
        else metrics.ageDistribution['180+']++;

        // Flag types
        metrics.flagTypes[flag.kind] = (metrics.flagTypes[flag.kind] || 0) + 1;

        // Lifecycle stages
        metrics.lifecycleStages[lifecycleStage] = (metrics.lifecycleStages[lifecycleStage] || 0) + 1;

        // Cleanup candidates
        if (lifecycleStage === 'Ready to Archive' || priorityScore >= 7) {
          if (lifecycleStage === 'Ready to Archive') metrics.readyToArchive++;
          if (priorityScore >= 7) metrics.highPriority++;
          metrics.cleanupCandidates.push(analyzedFlag);
        }
      }
    });

    // Sort cleanup candidates by priority
    metrics.cleanupCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

    // Generate alerts
    const alerts = generateAlerts(metrics);

    return { flags: analyzedFlags, metrics, alerts };
  };

  const determineLifecycleStage = (flag, ageDays) => {
    if (flag.archived) return 'Archived';
    if (ageDays < 30) return 'Live';
    if (ageDays >= 30 && flag.temporary) return 'Ready for Review';
    if (ageDays >= 90 && flag.temporary) return 'Ready to Archive';
    return 'Permanent';
  };

  const calculatePriorityScore = (flag, ageDays) => {
    let score = 1;
    
    if (ageDays > 180) score += 4;
    else if (ageDays > 90) score += 3;
    else if (ageDays > 30) score += 2;
    
    if (flag.temporary) score += 2;
    
    const envCount = Object.keys(flag.environments || {}).length;
    if (envCount <= 2) score += 2;
    
    return Math.min(score, 10);
  };

  const generateAlerts = (metrics) => {
    const alerts = [];
    
    if (metrics.highPriority > 10) {
      alerts.push({
        level: 'HIGH',
        message: `${metrics.highPriority} flags require immediate attention`,
        type: 'cleanup',
      });
    }
    
    if (metrics.readyToArchive > 20) {
      alerts.push({
        level: 'MEDIUM',
        message: `${metrics.readyToArchive} flags are ready to archive`,
        type: 'cleanup',
      });
    }
    
    const activeFlags = metrics.totalFlags - metrics.archivedFlags;
    if (activeFlags > 500) {
      alerts.push({
        level: 'MEDIUM',
        message: `${activeFlags} active flags may impact performance`,
        type: 'performance',
      });
    }
    
    return alerts;
  };

  const handleArchiveFlag = async (flagKey) => {
    try {
      setLoading(true);
      await launchDarklyService.archiveFlag(flagKey);
      enqueueSnackbar(`Flag ${flagKey} archived successfully`, { variant: 'success' });
      await loadData(); // Refresh data
    } catch (error) {
      enqueueSnackbar(`Error archiving flag: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    // Save to localStorage
    localStorage.setItem('launchdarkly_api_token', newConfig.apiToken);
    localStorage.setItem('launchdarkly_project_key', newConfig.projectKey);
  };

  const handleExportData = () => {
    const csvData = metrics.cleanupCandidates.map(flag => ({
      'Flag Key': flag.key,
      'Name': flag.name,
      'Age (days)': flag.ageDays,
      'Lifecycle Stage': flag.lifecycleStage,
      'Priority Score': flag.priorityScore,
      'Temporary': flag.temporary,
    }));

    // Create CSV content
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flag_cleanup_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter flags based on current filters
  const filteredFlags = flagsData.filter(flag => {
    if (!config.includeArchived && flag.archived) return false;
    if (flag.ageDays < config.ageFilter) return false;
    if (!config.flagTypes.includes(flag.kind)) return false;
    if (config.lifecycleStages.length && !config.lifecycleStages.includes(flag.lifecycleStage)) return false;
    return true;
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static">
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
            <Flag sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              LaunchDarkly Governance Dashboard
            </Typography>
            <Button
              color="inherit"
              startIcon={<Refresh />}
              onClick={loadData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Refresh'}
            </Button>
          </Toolbar>
        </AppBar>

        {/* Configuration Drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <ConfigurationSidebar
            config={config}
            onConfigChange={handleConfigChange}
            onClose={() => setDrawerOpen(false)}
          />
        </Drawer>

        <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
          {/* Status Bar */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Project: <strong>{config.projectKey || 'Not configured'}</strong>
                  {lastUpdate && (
                    <>
                      {' | Last updated: '}
                      <strong>{lastUpdate.toLocaleTimeString()}</strong>
                    </>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                <Button
                  startIcon={<Download />}
                  onClick={handleExportData}
                  disabled={!metrics.cleanupCandidates?.length}
                  size="small"
                >
                  Export CSV
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {!config.apiToken || !config.projectKey ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please configure your LaunchDarkly API credentials using the menu button.
            </Alert>
          ) : (
            <>
              {/* Metrics Cards */}
              <MetricsCards metrics={metrics} />

              {/* Tabs */}
              <Paper sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Overview" />
                    <Tab label="Analysis" />
                    <Tab label="Recommendations" />
                    <Tab label="Alerts" />
                  </Tabs>
                </Box>

                {/* Overview Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FlagLifecycleChart data={metrics.lifecycleStages} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FlagTypesChart data={metrics.flagTypes} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <AgeDistributionChart data={metrics.ageDistribution} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TimelineChart flags={filteredFlags} />
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Analysis Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <PriorityScatterChart flags={filteredFlags} />
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Recommendations Tab */}
                <TabPanel value={tabValue} index={2}>
                  <CleanupRecommendationsTable
                    flags={metrics.cleanupCandidates || []}
                    onArchive={handleArchiveFlag}
                    loading={loading}
                  />
                </TabPanel>

                {/* Alerts Tab */}
                <TabPanel value={tabValue} index={3}>
                  <AlertsSection alerts={alerts} metrics={metrics} />
                </TabPanel>
              </Paper>
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default function AppWithSnackbar() {
  return (
    <SnackbarProvider maxSnack={3}>
      <App />
    </SnackbarProvider>
  );
}
