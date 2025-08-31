import React from 'react';
// ---------------------------------------------
// AlertsSection: Displays governance alerts and insights
// ---------------------------------------------
import {
  Typography,
  Alert,
  AlertTitle,
  Box,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Info,
  Error,
} from '@mui/icons-material';

const getAlertSeverity = (level) => {
// Maps alert level to MUI severity
  switch (level) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'info';
    default: return 'info';
  }
};

const getAlertIcon = (level) => {
// Maps alert level to icon
  switch (level) {
    case 'HIGH': return <Error />;
    case 'MEDIUM': return <Warning />;
    case 'LOW': return <Info />;
    default: return <Info />;
  }
};

const AlertsSection = ({ alerts, metrics }) => {
  // Calculate ratios and averages for insights
  const totalFlags = metrics?.totalFlags ?? 0;
  const activeFlags = totalFlags - (metrics?.archivedFlags ?? 0);
  const tempRatio = activeFlags > 0 ? ((metrics?.temporaryFlags ?? 0) / activeFlags * 100) : 0;
  const oldRatio = activeFlags > 0 ? ((metrics?.ageDistribution?.['180+'] ?? 0) / activeFlags * 100) : 0;
  const avgPriority = metrics?.cleanupCandidates?.length > 0 
    ? metrics.cleanupCandidates.reduce((sum, flag) => sum + flag.priorityScore, 0) / metrics.cleanupCandidates.length 
    : 0;

  const hasMetrics = totalFlags > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Governance Alerts
      </Typography>
      {/* Alert Messages */}
      <Box sx={{ mb: 3 }}>
        {alerts && alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={getAlertSeverity(alert.level)} 
              icon={getAlertIcon(alert.level)}
              sx={{ mb: 1 }}
            >
              <AlertTitle>{alert.level} Priority</AlertTitle>
              {alert.message}
            </Alert>
          ))
        ) : (
          <Alert severity="success" icon={<CheckCircle />}>
            <AlertTitle>All Clear!</AlertTitle>
            No alerts - your flag governance looks healthy!
          </Alert>
        )}
      </Box>

      {/* Governance Insights */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Governance Insights
      </Typography>
      {hasMetrics ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom>
                  {tempRatio.toFixed(1)}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Temporary Flags
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {tempRatio > 80 ? 'High ratio - monitor for permanent candidates' : 
                   tempRatio > 60 ? 'Moderate ratio - regular review recommended' : 
                   'Healthy ratio'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {oldRatio.toFixed(1)}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Flags {'>'} 180 days
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {oldRatio > 20 ? 'High - immediate cleanup needed' : 
                   oldRatio > 10 ? 'Moderate - schedule cleanup review' : 
                   'Low - good maintenance'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error.main" gutterBottom>
                  {avgPriority.toFixed(1)}/10
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Avg Priority Score
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {avgPriority > 7 ? 'High - urgent attention needed' : 
                   avgPriority > 4 ? 'Moderate - schedule maintenance' : 
                   'Low - minimal action required'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          No governance metrics available. Please check your data source or refresh.
        </Alert>
      )}
    </Box>
  );
};

export default AlertsSection;
