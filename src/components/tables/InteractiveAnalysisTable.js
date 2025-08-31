
import React from 'react';

import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography, Box, Chip, Tooltip, Avatar } from '@mui/material';

// Helper to generate a color from a string
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
}

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    if (cmp !== 0) return cmp;
    return a[1] - b[1];
  });
  return stabilized.map(el => el[0]);
}



// Helper functions for chip colors (reuse from CleanupRecommendationsTable)
function getLifecycleColor(stage) {
  switch (stage) {
    case 'experimental': return 'warning';
    case 'active': return 'success';
    case 'deprecated': return 'error';
    default: return 'default';
  }
}
function getPriorityColor(score) {
  if (score >= 8) return 'error';
  if (score >= 5) return 'warning';
  return 'default';
}

const columns = [
  { id: 'name', label: 'Name' },
  { id: 'tags', label: 'Tag' },
  { id: 'ageDays', label: 'Age (days)', numeric: true },
  { id: 'lifecycleStage', label: 'Lifecycle Stage' },
  { id: 'priorityScore', label: 'Priority', numeric: true },
  { id: 'temporary', label: 'Temporary' },
];

const InteractiveAnalysisTable = ({ flags }) => {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('priorityScore');

  if (!flags || flags.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Flag Analysis Table</Typography>
      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map(col => (
                  <TableCell key={col.id} align={col.numeric ? 'right' : 'left'}>
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stableSort(flags, getComparator(order, orderBy)).map(flag => (
                <TableRow key={flag.key} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {flag._maintainer?.firstName && flag._maintainer?.lastName ? (
                        <Tooltip title={`${flag._maintainer.firstName} ${flag._maintainer.lastName}`} arrow>
                          <Avatar
                            sx={{ width: 28, height: 28, fontSize: 14, bgcolor: stringToColor(flag._maintainer.firstName + flag._maintainer.lastName) }}
                          >
                            {flag._maintainer.firstName[0]}{flag._maintainer.lastName[0]}
                          </Avatar>
                        </Tooltip>
                      ) : (
                        <Avatar sx={{ width: 28, height: 28, fontSize: 14, bgcolor: '#b71c1c' }}>??</Avatar>
                      )}
                      <Typography variant="body2">{flag.name || 'No name'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {Array.isArray(flag.tags) && flag.tags.length > 0 ? (
                        flag.tags.length === 1 ? (
                          <Chip
                            key={flag.tags[0]}
                            label={flag.tags[0]}
                            size="small"
                            sx={{ bgcolor: stringToColor(flag.tags[0]), color: '#222', fontWeight: 700 }}
                          />
                        ) : (
                          <Tooltip title={flag.tags.slice(1).join(', ')} arrow>
                            <Chip
                              key={flag.tags[0]}
                              label={flag.tags[0] + ' +' + (flag.tags.length - 1)}
                              size="small"
                              sx={{ bgcolor: stringToColor(flag.tags[0]), color: '#222', fontWeight: 700, cursor: 'pointer' }}
                            />
                          </Tooltip>
                        )
                      ) : (
                        <Chip label="No tags" size="small" sx={{ bgcolor: '#bdbdbd', color: '#222', fontWeight: 700 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{flag.ageDays}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {Array.isArray(flag.lifecycleStage) ? (
                      flag.lifecycleStage.length === 1 ? (
                        <Chip label={flag.lifecycleStage[0]} color={getLifecycleColor(flag.lifecycleStage[0])} size="small" sx={{ color: '#222', fontWeight: 700 }} />
                      ) : (
                        <Tooltip title={flag.lifecycleStage.slice(1).join(', ')} arrow>
                          <Chip
                            label={flag.lifecycleStage[0] + ' +' + (flag.lifecycleStage.length - 1)}
                            color={getLifecycleColor(flag.lifecycleStage[0])}
                            size="small"
                            sx={{ color: '#222', fontWeight: 700, cursor: 'pointer' }}
                          />
                        </Tooltip>
                      )
                    ) : (
                      <Chip label={flag.lifecycleStage} color={getLifecycleColor(flag.lifecycleStage)} size="small" sx={{ color: '#222', fontWeight: 700 }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`${flag.priorityScore}/10`} color={getPriorityColor(flag.priorityScore)} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={flag.temporary ? 'Yes' : 'No'} color={flag.temporary ? 'warning' : 'default'} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default InteractiveAnalysisTable;
