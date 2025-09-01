import React from 'react';
// ---------------------------------------------
// AlertsSection: Displays governance alerts and insights
// ---------------------------------------------
import {
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Paper,
  Divider,
} from '@mui/material';

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
    <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Governance Alerts & Insights
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {/* Governance Insights */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 500 }}>
        Governance Insights
      </Typography>
      {hasMetrics ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
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
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h4" color="warning.main" gutterBottom sx={{ fontWeight: 700 }}>
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
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h4" color="error.main" gutterBottom sx={{ fontWeight: 700 }}>
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
    </Paper>
  );
};

export default AlertsSection;
