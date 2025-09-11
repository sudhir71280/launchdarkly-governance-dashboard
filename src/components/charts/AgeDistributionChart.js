import React from 'react';
// ---------------------------------------------
// AgeDistributionChart: Shows distribution of flag ages
// ---------------------------------------------
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const AgeDistributionChart = ({ data }) => {
  // If passed an array, treat as flags array; else fallback to old behavior
  let ageDistribution = { '0-30': 0, '31-90': 0, '91-180': 0, '180+': 0 };
  if (Array.isArray(data)) {
    const now = new Date();
    data.filter(f => !f.archived).forEach(flag => {
      const ageDays = Math.floor((now - new Date(flag.creationDate)) / (1000 * 60 * 60 * 24));
      if (ageDays <= 30) ageDistribution['0-30']++;
      else if (ageDays <= 90) ageDistribution['31-90']++;
      else if (ageDays <= 180) ageDistribution['91-180']++;
      else ageDistribution['180+']++;
    });
  } else if (data && typeof data === 'object') {
    ageDistribution = data;
  }
  const chartData = Object.entries(ageDistribution).map(([name, value]) => ({ name, value }));
  if (chartData.length === 0 || chartData.every(item => item.value === 0)) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }
  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Flag Age Distribution
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default AgeDistributionChart;
