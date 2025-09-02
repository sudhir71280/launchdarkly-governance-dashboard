import React from 'react';
// ---------------------------------------------
// MetricsCards: Displays summary cards for flag metrics
// ---------------------------------------------
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
} from '@mui/material';
import {
    Flag,
    Archive,
    Warning,
    Schedule,
} from '@mui/icons-material';

const MetricCard = ({ title, value, icon, color = 'primary', progress, description }) => (
    // MetricCard: Single metric display with optional progress bar and description
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color === 'primary' ? '#667eea 0%, #764ba2 100%' : color === 'secondary' ? '#f093fb 0%, #f5576c 100%' : color === 'success' ? '#4facfe 0%, #00f2fe 100%' : color === 'error' ? '#f5576c 0%, #f093fb 100%' : color === 'warning' ? '#ffb347 0%, #ffcc80 100%' : color === 'info' ? '#43e97b 0%, #38f9d7 100%' : '#bdbdbd 0%, #e0e0e0 100%'})` }}>
        <CardContent sx={{ color: 'white', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {value || 0}
                    </Typography>
                    <Typography variant="body1" component="div">
                        {title}
                    </Typography>
                    {description && (
                        <Typography variant="body2" sx={{ display: 'block', mt: 0.5, opacity: 1, fontWeight: 500 }}>
                            {description}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ opacity: 0.3, fontSize: '3rem' }}>
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
                                backgroundColor: 'rgba(255,255,255,0.8)'
                            }
                        }}
                    />
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        {progress.toFixed(1)}%
                    </Typography>
                </Box>
            )}
        </CardContent>
    </Card>
);

const MetricsCards = ({ metrics }) => {
    // Calculate percentages for progress bars
    const totalActive = metrics.totalFlags - (metrics.archivedFlags || 0);
    const cleanupPercentage = totalActive > 0 ? ((metrics.readyToArchive || 0) / totalActive) * 100 : 0;
    const tempPercentage = totalActive > 0 ? ((metrics.temporaryFlags || 0) / totalActive) * 100 : 0;
    const permanentPercentage = totalActive > 0 ? ((metrics.permanentFlags || 0) / totalActive) * 100 : 0;
    const archivedPercentage = metrics.totalFlags > 0 ? ((metrics.archivedFlags || 0) / metrics.totalFlags) * 100 : 0;
    return (
        <>
            {/* Row 1 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Total Flags"
                        value={metrics.totalFlags}
                        icon={<Flag />}
                        color="primary"
                        description="Count of all flags in the system."
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Temporary Flags"
                        value={metrics.temporaryFlags}
                        icon={<Schedule />}
                        color="info"
                        progress={tempPercentage}
                        description="Count of flags where flag.temporary is true."
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Live Flags"
                        value={metrics.lifecycleStages?.Live || 0}
                        icon={<Flag />}
                        color="info"
                        description="Count of flags currently in the 'Live' lifecycle stage."
                    />
                </Grid>
            </Grid>
            {/* Row 2 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Permanent Flags"
                        value={metrics.permanentFlags}
                        icon={<Flag />}
                        color="success"
                        progress={permanentPercentage}
                        description="Count of flags where flag.temporary is false."
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Ready to Review"
                        value={metrics.readyToReview}
                        icon={<Warning />}
                        color="error"
                        description="Count of flags where lifecycleStage is 'Ready to Review'."
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <MetricCard
                        title="Ready to Archive"
                        value={metrics.readyToArchive}
                        icon={<Archive />}
                        color="warning"
                        progress={cleanupPercentage}
                        description="Count of flags where lifecycleStage is 'Ready to Archive'."
                    />
                </Grid>
            </Grid>
            {/* Row 3 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
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

export default MetricsCards;
