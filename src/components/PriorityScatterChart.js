import React from 'react';
// ---------------------------------------------
// PriorityScatterChart: Shows flag age vs. cleanup priority
// ---------------------------------------------
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const PriorityScatterChart = ({ flags }) => {
  // Prepare chart data from flags
  const chartData = flags.map(flag => ({
    x: flag.ageDays,
    y: flag.priorityScore,
    name: flag.key,
    lifecycle: flag.lifecycleStage,
    temporary: flag.temporary,
  }));

  if (chartData.length === 0) {
  // Show message if no data is available
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
  // Custom tooltip for chart points
  // Render scatter chart for flag analysis
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ 
          backgroundColor: 'white', 
          p: 2, 
          border: '1px solid #ccc', 
          borderRadius: 1,
          boxShadow: 2 
        }}>
          <Typography variant="subtitle2">{data.name}</Typography>
          <Typography variant="body2">Age: {data.x} days</Typography>
          <Typography variant="body2">Priority: {data.y}/10</Typography>
          <Typography variant="body2">Stage: {data.lifecycle}</Typography>
          <Typography variant="body2">Temporary: {data.temporary ? 'Yes' : 'No'}</Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ p: 3, height: 500 }}>
      <Typography variant="h6" gutterBottom>
        Cleanup Priority vs Flag Age
      </Typography>
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Age (days)" 
              label={{ value: 'Age (days)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Priority Score" 
              domain={[0, 10]}
              label={{ value: 'Priority Score', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              dataKey="y" 
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default PriorityScatterChart;
