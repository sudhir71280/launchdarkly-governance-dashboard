import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { format, parseISO } from 'date-fns';

const TimelineChart = ({ flags }) => {
  // Group flags by creation month
  const monthlyData = {};
  
  flags.forEach(flag => {
    const date = new Date(flag.creationDate);
    const monthKey = format(date, 'yyyy-MM');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, count: 0 };
    }
    monthlyData[monthKey].count++;
  });

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(item => ({
      ...item,
      displayMonth: format(parseISO(item.month + '-01'), 'MMM yyyy')
    }));

  if (chartData.length === 0) {
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
        Flag Creation Timeline
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayMonth" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#FF8042" 
              strokeWidth={2}
              dot={{ fill: '#FF8042', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default TimelineChart;
