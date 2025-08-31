import React from 'react';
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

const MetricCard = ({ title, value, icon, color = 'primary', progress }) => (
  <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color === 'primary' ? '#667eea 0%, #764ba2 100%' : color === 'secondary' ? '#f093fb 0%, #f5576c 100%' : color === 'success' ? '#4facfe 0%, #00f2fe 100%' : '#43e97b 0%, #38f9d7 100%'})` }}>
    <CardContent sx={{ color: 'white', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
            {value || 0}
          </Typography>
          <Typography variant="body1" component="div">
            {title}
          </Typography>
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
  const totalActive = metrics.totalFlags - (metrics.archivedFlags || 0);
  const cleanupPercentage = totalActive > 0 ? ((metrics.readyToArchive || 0) / totalActive) * 100 : 0;
  const tempPercentage = totalActive > 0 ? ((metrics.temporaryFlags || 0) / totalActive) * 100 : 0;
  const highPriorityPercentage = totalActive > 0 ? ((metrics.highPriority || 0) / totalActive) * 100 : 0;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Flags"
          value={metrics.totalFlags}
          icon={<Flag />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Ready to Archive"
          value={metrics.readyToArchive}
          icon={<Archive />}
          color="secondary"
          progress={cleanupPercentage}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="High Priority"
          value={metrics.highPriority}
          icon={<Warning />}
          color="warning"
          progress={highPriorityPercentage}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Temporary Flags"
          value={metrics.temporaryFlags}
          icon={<Schedule />}
          color="success"
          progress={tempPercentage}
        />
      </Grid>
    </Grid>
  );
};

export default MetricsCards;
