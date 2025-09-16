import React from 'react';
// ---------------------------------------------
// DashboardCards: Displays summary cards for flag metrics
// ---------------------------------------------
import { Grid, Card, CardContent, Typography, Box, LinearProgress, Tooltip, styled } from '@mui/material';
import { Flag, Archive, Warning, } from '@mui/icons-material';

const ModernTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .MuiTooltip-tooltip`]: {
        backgroundColor: '#222',
        color: '#fff',
        fontSize: 16,
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        padding: theme.spacing(2),
        maxWidth: 320,
        textAlign: 'center',
    },
    [`& .MuiTooltip-arrow`]: {
        color: '#222',
    },
}));

const MetricCard = ({ title, value, icon, color = 'primary', progress, description }) => {
    return (
        <ModernTooltip title={description || ''} arrow placement="top">
            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color === 'primary' ? '#3a3a7c 0%, #764ba2 100%' : color === 'secondary' ? '#f093fb 0%, #f5576c 100%' : color === 'success' ? '#2e7d32 0%, #00f2fe 100%' : color === 'error' ? '#c62828 0%, #f093fb 100%' : color === 'warning' ? '#ff9800 0%, #ffcc80 100%' : color === 'info' ? '#0288d1 0%, #38f9d7 100%' : '#616161 0%, #e0e0e0 100%'})`, boxShadow: 8, borderRadius: 3 }}>
                <CardContent sx={{ color: 'white', position: 'relative', overflow: 'hidden', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                {value || 0}
                            </Typography>
                            <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                {title}
                            </Typography>
                        </Box>
                        <Box sx={{ opacity: 0.95, fontSize: '3.5rem', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                            {icon}
                        </Box>
                    </Box>
                    {progress !== undefined && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: 'rgba(255,255,255,1)'
                                    }
                                }}
                            />
                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                {progress.toFixed(1)}%
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </ModernTooltip>
    );
};

const DashboardCards = ({ metrics, description }) => {
    // Calculate percentages for progress bars
    const totalActive = metrics.totalFlags;
    const readyToArchivePercentage = totalActive > 0 ? ((metrics.lifecycleStages?.['Ready to Archive'] || 0) / totalActive) * 100 : 0;
    const readyToReviewPercentage = totalActive > 0 ? ((metrics.lifecycleStages?.['Ready for Review'] || 0) / totalActive) * 100 : 0;
    const liveFlagsPercentage = totalActive > 0 ? ((metrics.lifecycleStages?.Live || 0) / totalActive) * 100 : 0;
    const archivedPercentage = totalActive > 0 ? ((metrics.lifecycleStages?.Archived || 0) / totalActive) * 100 : 0;
    return (
        <>
            {/* Executive Description Section */}
            {description && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Dashboard Overview
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        {description}
                    </Typography>
                </Box>
            )}
            {/* Presentation View: All metrics in a single responsive row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={12} md={12}>
                    <MetricCard
                        title="Total Flags"
                        value={metrics.totalFlags}
                        icon={<Flag />}
                        color="primary"
                        description="Count of all flags in the system."
                    />
                </Grid>
            </Grid>
            {/* Row 2 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4} md={3}>
                    <MetricCard
                        title="Live Flags"
                        value={metrics.lifecycleStages?.Live || 0}
                        icon={<Flag />}
                        color="success"
                        progress={liveFlagsPercentage}
                        description="Flags created within the past 30 days."
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                    <MetricCard
                        title="Ready to Review"
                        value={metrics.lifecycleStages?.['Ready for Review'] || 0}
                        icon={<Warning />}
                        color="warning" // yellow
                        progress={readyToReviewPercentage}
                        description="Temporary flags (age >30 days)."
                    />
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                    <MetricCard
                        title="Ready to Archive"
                        value={metrics.lifecycleStages?.['Ready to Archive'] || 0}
                        icon={<Archive />}
                        color="error" // red
                        progress={readyToArchivePercentage}
                        description="Flags tagged as ‘Ready to Archive’"
                    />
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                    <MetricCard
                        title="Archived"
                        value={metrics.lifecycleStages?.['Archived'] || 0}
                        icon={<Archive />}
                        color="error" // red
                        progress={archivedPercentage}
                        description="Flags marked as ‘Archived’"
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default DashboardCards;
