import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';





// Line chart for flag analysis
const PriorityLineChart = ({ flags }) => {
  // Prepare chart data: each flag is a point
  const chartData = flags
    .map(flag => ({
      x: flag.ageDays,
      y: flag.priorityScore,
      name: flag.key,
      lifecycle: flag.lifecycleStage,
      temporary: flag.temporary,
    }))
    .sort((a, b) => a.x - b.x); // Sort by age for line chart

  if (chartData.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ backgroundColor: 'white', p: 2, border: '1px solid #ccc', borderRadius: 1, boxShadow: 2 }}>
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
      <Box sx={{ height: 350, pb: 1 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              type="number"
              dataKey="x"
              name="Age (days)"
              label={{ value: 'Age (days)', position: 'bottom', offset: 10, fontSize: 16 }}
              allowDataOverflow={true}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis type="number" dataKey="y" name="Priority Score" domain={[0, 10]} label={{ value: 'Priority Score', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="y" stroke="#1976d2" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default PriorityLineChart;
