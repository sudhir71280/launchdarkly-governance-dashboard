// ------------------------------
// LaunchDarkly Governance Dashboard
// Main App Component
// ------------------------------

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container, Grid, Paper, Typography, AppBar, Toolbar, IconButton, Drawer, Button, Alert, Tab, Tabs } from '@mui/material';
import { Flag, Menu, Download, AssignmentTurnedIn, Warning, Refresh } from '@mui/icons-material';
import { SnackbarProvider, useSnackbar } from 'notistack';

// Import custom components
import DashboardCards from './components/DashboardCards';
import AgeDistributionChart from './components/charts/AgeDistributionChart';
import PriorityBubbleChart from './components/charts/PriorityScatterChart';
import TimelineChart from './components/charts/TimelineChart';
import RecommendationsTable from './components/tables/RecommendationsTable';
import ConfigurationSidebar from './components/layout/ConfigurationSidebar';
import FlagGovernanceStandards from './components/FlagGovernanceStandards';
import { CircularProgress } from '@mui/material';
import { LaunchDarklyService } from './services/LaunchDarklyService';

import './styles/App.css';
import { analyzeFlags } from './utils/flagUtils';
import { exportDashboardToExcel } from './utils/exportDashboardToExcel';

// Theme configuration for Material-UI
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#dde5eeff',
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
        // Fetch data when API token, project key, or includeArchived changes
        if (config.apiToken && config.projectKey) {
            loadData();
        }
    }, [config.apiToken, config.projectKey, config.includeArchived]);

    // Fetches flag data and updates state
    const loadData = async () => {
        if (!config.apiToken || !config.projectKey) {
            enqueueSnackbar('Please configure API credentials', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const data = await launchDarklyService.fetchFlags({ includeArchived: config.includeArchived });
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

    // Exports dashboard, agewise, and all flags data to Excel file
    const handleExportExcel = () => {
        exportDashboardToExcel(metrics, flagsData || [], config.includeArchived);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* App Bar - fixed position */}
                <AppBar position="fixed" sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)', boxShadow: 3, minHeight: 72 }}>
                    <Toolbar sx={{ minHeight: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                        {/* Left: Hamburger menu */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{
                                mr: 2,
                                color: '#fff',
                                background: 'linear-gradient(135deg, #1976d2 0%, #00c6ff 100%)',
                                borderRadius: 2,
                                p: 0.5,
                                boxShadow: 3,
                                border: '2px solid #fff',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #00c6ff 0%, #1976d2 100%)',
                                    transform: 'scale(1.08)',
                                    boxShadow: '0 0 0 4px #90caf9',
                                },
                            }}>
                                <Menu sx={{ fontSize: 36 }} />
                            </IconButton>
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                                LaunchDarkly Governance Dashboard
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                                Project: <strong>{config.projectKey ? config.projectKey : 'N/A'}</strong>
                                {' | Last updated: '}
                                <strong>{lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}</strong>
                            </Typography>
                        </Box>
                        {/* Right: Controls (Refresh, Export) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={loadData}
                                disabled={loading}
                                startIcon={<Refresh sx={{ fontSize: 24 }} />}
                                sx={{
                                    borderRadius: 3,
                                    boxShadow: 2,
                                    fontWeight: 700,
                                    minWidth: 40,
                                    px: 2,
                                    background: 'linear-gradient(90deg, #8e24aa 0%, #1976d2 100%)',
                                    color: 'white',
                                    letterSpacing: 1,
                                    textTransform: 'uppercase',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #6a1b9a 0%, #1565c0 100%)',
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : 'Refresh'}
                            </Button>

                            {/* Export CSV and Excel buttons for cleanup candidates */}
                            {tabValue === 2 && metrics.cleanupCandidates && metrics.cleanupCandidates.length > 0 && (
                                <>
                                    <Button
                                        variant="contained"
                                        color="info"
                                        onClick={handleExportExcel}
                                        sx={{ borderRadius: 3, boxShadow: 1, fontWeight: 600, minWidth: 40, px: 2, ml: 1 }}
                                        startIcon={<Download />}
                                    >
                                        Export Excel
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Toolbar>
                    {/* Tabs below AppBar, sticky */}
                    <Box sx={{ position: 'sticky', top: 72, zIndex: 1200, borderColor: 'divider', background: 'rgba(255,255,255,0.97)', boxShadow: 1 }}>
                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="inherit"
                            sx={{ '& .MuiTab-root': { color: '#222', fontWeight: 600 }, '& .Mui-selected': { color: '#1976d2 !important' }, minHeight: 48 }}
                        >
                            <Tab icon={<Flag sx={{ fontSize: 24, mr: 1 }} color="info" />} label="Dashboard" iconPosition="start" />
                            <Tab icon={<Download sx={{ fontSize: 24, mr: 1 }} color="secondary" />} label="Charts" iconPosition="start" />
                            <Tab icon={<Warning sx={{ fontSize: 24, mr: 1 }} color="warning" />} label="Cleanup Recommendations" iconPosition="start" />
                            <Tab icon={<AssignmentTurnedIn sx={{ fontSize: 24, mr: 1 }} color="success" />} label="Overview" iconPosition="start" />
                        </Tabs>
                    </Box>
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
                <Container maxWidth="xl" sx={{ mt: 17, mb: 2 }}>
                    {!config.apiToken || !config.projectKey ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Please configure your LaunchDarkly API credentials using the menu button.
                        </Alert>
                    ) : (
                        <>
                            {/* Tabs: Dashboard, Charts, Cleanup Recommendations */}
                            <Paper sx={{ width: '100%', mb: 2 }}>
                                {/* Dashboard Tab: Metrics Cards */}
                                <TabPanel value={tabValue} index={0}>
                                    <Grid container spacing={2} marginTop={2}>
                                        <Grid item xs={12} md={6}></Grid>
                                        <DashboardCards metrics={metrics || {}} includeArchived={config.includeArchived} />
                                    </Grid>
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
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={12}>
                                            <RecommendationsTable
                                                flags={flagsData || []}
                                                loading={loading}
                                                hideAttentionMessage={true}
                                            />
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                {/* Standards Tab: Launch Darkly Flags Lifecycle Standards */}
                                <TabPanel value={tabValue} index={3}>
                                    <FlagGovernanceStandards />
                                </TabPanel>
                            </Paper>
                        </>
                    )}
                </Container>
            </Box>
        </ThemeProvider >
    );
}

export default function AppWithSnackbar() {
    return (
        <SnackbarProvider maxSnack={3}>
            <App />
        </SnackbarProvider>
    );
}
