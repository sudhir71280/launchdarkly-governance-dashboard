// ------------------------------
// LaunchDarkly Governance Dashboard
// Main App Component
// ------------------------------

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container, Grid, Paper, Typography, AppBar, Toolbar, IconButton, Drawer, Button, Alert, Tab, Tabs, CircularProgress } from '@mui/material';
import { Flag, Refresh, Menu, Download, } from '@mui/icons-material';
import { SnackbarProvider, useSnackbar } from 'notistack';

// Import custom components
import DashboardCards from './components/DashboardCards';
import AgeDistributionChart from './components/charts/AgeDistributionChart';
import PriorityBubbleChart from './components/charts/PriorityScatterChart';
import TimelineChart from './components/charts/TimelineChart';
import CleanupRecommendationsTable from './components/tables/CleanupRecommendationsTable';
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
    const [config, setConfig] = useState({
        apiToken: localStorage.getItem('launchdarkly_api_token') || '',
        projectKey: localStorage.getItem('launchdarkly_project_key') || '',
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
            const data = await launchDarklyService.fetchFlags(true);
            const analyzedData = analyzeFlags(data.items || []);

            setFlagsData(analyzedData.flags);
            setMetrics(analyzedData.metrics);
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
                            <Menu sx={{ fontSize: 40 }} />
                        </IconButton>
                        <Flag sx={{ mr: 2, fontSize: 40 }} />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                                LaunchDarkly Governance Dashboard
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                                Project: <strong>{config.projectKey ? config.projectKey : 'N/A'}</strong>
                                {' | Last updated: '}
                                <strong>{lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}</strong>
                            </Typography>
                        </Box>
                        <Button
                            color="inherit"
                            startIcon={<Refresh sx={{ fontSize: 40 }} />}
                            onClick={loadData}
                            disabled={loading}
                            sx={{ fontSize: 20, fontWeight: 400 }}
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
                                    <DashboardCards metrics={metrics || {}} />
                                </TabPanel>

                                {/* Charts Tab (restored) */}
                                <TabPanel value={tabValue} index={1}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <AgeDistributionChart data={metrics.ageDistribution} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TimelineChart flags={flagsData} />
                                        </Grid>
                                        <Grid item xs={12} md={12}>
                                            <PriorityBubbleChart flags={flagsData} />
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                {/* Cleanup Recommendations Tab */}
                                <TabPanel value={tabValue} index={2}>
                                    {/* Export CSV button for cleanup candidates */}
                                    {metrics.cleanupCandidates && metrics.cleanupCandidates.length > 0 && (
                                        <Box sx={{ textAlign: 'right', mb: 2 }}>
                                            <Button
                                                startIcon={<Download />}
                                                onClick={handleExportData}
                                                size="medium"
                                                sx={{
                                                    background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                                                    },
                                                }}
                                            >
                                                Export CSV
                                            </Button>
                                        </Box>
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
