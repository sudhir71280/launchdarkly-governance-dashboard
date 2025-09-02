// ------------------------------
// LaunchDarkly Governance Dashboard
// Main App Component
// ------------------------------

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container, Grid, Paper, Typography, AppBar, Toolbar, IconButton, Drawer, Button, Alert, Tab, Tabs, CircularProgress } from '@mui/material';
import { Flag, Refresh, Menu, Download, } from '@mui/icons-material';
import { SnackbarProvider, useSnackbar } from 'notistack';

// Import custom components
import MetricsCards from './components/MetricsCards';
import FlagLifecycleChart from './components/charts/FlagLifecycleChart';
import AgeDistributionChart from './components/charts/AgeDistributionChart';
import PriorityBubbleChart from './components/charts/PriorityScatterChart';
import TimelineChart from './components/charts/TimelineChart';
import FlagTypesChart from './components/charts/FlagTypesChart';
// import CleanupRecommendationsTable from './components/CleanupRecommendationsTable';
import CleanupRecommendationsTable from './components/tables/CleanupRecommendationsTable';
import AlertsSection from './components/AlertsSection';
// import ConfigurationSidebar from './components/ConfigurationSidebar';
import ConfigurationSidebar from './components/layout/ConfigurationSidebar';
import { LaunchDarklyService } from './services/LaunchDarklyService';

import './styles/App.css';
import { analyzeFlags, exportCleanupCandidatesToCSV } from './utils/flagUtils';

// Theme configuration for Material-UI
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

// TabPanel: Renders content for each tab
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
    // ------------------------------
    // State Variables
    // ------------------------------
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
        environment: localStorage.getItem('launchdarkly_environment') || '',
    });

    // Snackbar for notifications
    const { enqueueSnackbar } = useSnackbar();

    // Service instance for LaunchDarkly API
    const launchDarklyService = new LaunchDarklyService(config.apiToken, config.projectKey);

    // ------------------------------
    // Data Fetching & Effects
    // ------------------------------
    useEffect(() => {
        // Fetch data when API token or project key changes
        if (config.apiToken && config.projectKey) {
            loadData();
        }
    }, [config.apiToken, config.projectKey]);

    // Fetches flag data and updates state
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



    
    // Updates configuration and saves to localStorage
    const handleConfigChange = (newConfig) => {
        setConfig(newConfig);
        // Save to localStorage
        localStorage.setItem('launchdarkly_api_token', newConfig.apiToken);
        localStorage.setItem('launchdarkly_project_key', newConfig.projectKey);
        localStorage.setItem('launchdarkly_environment', newConfig.environment);
    };

    // Exports cleanup candidates to CSV file
    const handleExportData = () => {
        const csvContent = exportCleanupCandidatesToCSV(metrics.cleanupCandidates || []);
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flag_cleanup_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* App Bar - fixed position */}
                <AppBar position="fixed">
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

                {/* Add top margin to prevent content from being hidden behind fixed AppBar */}
                <Container maxWidth="xl" sx={{ mt: 10, mb: 2 }}>
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
                            {/* Tabs: Dashboard, Charts, Cleanup Recommendations */}
                            <Paper sx={{ width: '100%', mb: 2 }}>
                                <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
                                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                                        <Tab label="Dashboard" />
                                        <Tab label="Charts" />
                                        <Tab label="Cleanup Recommendations" />
                                    </Tabs>
                                </Box>

                                {/* Dashboard Tab: Metrics Cards */}
                                <TabPanel value={tabValue} index={0}>
                                    <MetricsCards metrics={metrics || {}} />
                                </TabPanel>

                                {/* Charts Tab (restored) */}
                                <TabPanel value={tabValue} index={1}>
                                    <Grid container spacing={2}>
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
                                            <TimelineChart flags={flagsData} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <PriorityBubbleChart flags={flagsData} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <AlertsSection alerts={alerts} metrics={metrics} />
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                {/* Cleanup Recommendations Tab */}
                                <TabPanel value={tabValue} index={2}>
                                    {/* Move HIGH Priority alert here */}
                                    {alerts && alerts.length > 0 && alerts.some(a => a.level === 'HIGH') && (
                                        alerts.filter(a => a.level === 'HIGH').map((alert, idx) => (
                                            <Alert key={idx} severity="error" sx={{ mb: 2 }}>
                                                <strong>HIGH Priority:</strong> {alert.message}
                                            </Alert>
                                        ))
                                    )}
                                    {/* Move MEDIUM Priority alert here */}
                                    {alerts && alerts.length > 0 && alerts.some(a => a.level === 'MEDIUM') && (
                                        alerts.filter(a => a.level === 'MEDIUM').map((alert, idx) => (
                                            <Alert key={idx} severity="warning" sx={{ mb: 2 }}>
                                                <strong>MEDIUM Priority:</strong> {alert.message}
                                            </Alert>
                                        ))
                                    )}
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={12}>
                                            <CleanupRecommendationsTable
                                                flags={metrics.cleanupCandidates || []}
                                                loading={loading}
                                                hideAttentionMessage={true}
                                            />
                                        </Grid>
                                    </Grid>
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
