import React from 'react';
// ---------------------------------------------
// FlagTypesChart: Shows distribution of flag types
// ---------------------------------------------
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const FlagTypesChart = ({ data }) => {
  // Prepare chart data from flag types object
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name,
    value,
  }));

  if (chartData.length === 0) {
  // Show message if no data is available
    return (
  // Render bar chart for flag types
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
        Flag Types Distribution
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default FlagTypesChart;
