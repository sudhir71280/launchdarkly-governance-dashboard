import React from 'react';
// ---------------------------------------------
// DashboardCards: Displays summary cards for flag metrics
// ---------------------------------------------
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    Tooltip,
    styled
} from '@mui/material';
import {
    Flag,
    Archive,
    Warning,
    Schedule,
} from '@mui/icons-material';

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
    const totalActive = metrics.totalFlags - (metrics.archivedFlags || 0);
    const tempPercentage = totalActive > 0 ? ((metrics.temporaryFlags || 0) / totalActive) * 100 : 0;
    const permanentPercentage = totalActive > 0 ? ((metrics.permanentFlags || 0) / totalActive) * 100 : 0;
    const archivedPercentage = metrics.totalFlags > 0 ? ((metrics.archivedFlags || 0) / metrics.totalFlags) * 100 : 0;
    const readyToArchivePercentage = totalActive > 0 ? ((metrics.readyToArchive || 0) / totalActive) * 100 : 0;
    const readyToReviewPercentage = totalActive > 0 ? ((metrics.readyToReview || 0) / totalActive) * 100 : 0;
    const liveFlagsPercentage = totalActive > 0 ? ((metrics.lifecycleStages?.Live || 0) / totalActive) * 100 : 0;
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
                <Grid item xs={12} sm={3} md={3}>
                    <MetricCard
                        title="Total Flags"
                        value={metrics.totalFlags}
                        icon={<Flag />}
                        color="primary"
                        description="Count of all flags in the system."
                    />
                </Grid>
                <Grid item xs={12} sm={3} md={3}>
                    <MetricCard
                        title="Permanent Flags"
                        value={metrics.permanentFlags}
                        icon={<Flag />}
                        color="success"
                        progress={permanentPercentage}
                        description="Count of flags where flag.temporary is false."
                    />
                </Grid>
                <Grid item xs={12} sm={3} md={3}>
                    <MetricCard
                        title="Live Flags"
                        value={metrics.lifecycleStages?.Live || 0}
                        icon={<Flag />}
                        color="info"
                        progress={liveFlagsPercentage}
                        description="Count of flags currently in the 'Live' lifecycle stage."
                    />
                </Grid>
                <Grid item xs={12} sm={3} md={3}>
                    <MetricCard
                        title="Temporary Flags"
                        value={metrics.temporaryFlags - (metrics.lifecycleStages?.Live || 0)}
                        icon={<Schedule />}
                        color="secondary" // pink
                        progress={tempPercentage}
                        description="Count of flags where flag.temporary is true."
                    />
                </Grid>
            </Grid>
            {/* Row 2 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Ready to Review"
                        value={metrics.readyToReview}
                        icon={<Warning />}
                        color="warning" // yellow
                        progress={readyToReviewPercentage}
                        description="Count of flags where lifecycleStage is 'Ready to Review'."
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Ready to Archive"
                        value={metrics.readyToArchive}
                        icon={<Archive />}
                        color="error" // red
                        progress={readyToArchivePercentage}
                        description="Count of flags where lifecycleStage is 'Ready to Archive'."
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Archived Flags"
                        value={metrics.archivedFlags}
                        icon={<Archive />}
                        color="#bdbdbd"
                        progress={archivedPercentage}
                        description="Count of flags where flag.archived is true."
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default DashboardCards;
