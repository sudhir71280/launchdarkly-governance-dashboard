import React, { useState } from 'react';
// ---------------------------------------------
// RecommendationsTable: Table of flags needing cleanup
// ---------------------------------------------
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Tooltip, Box, Avatar, TableSortLabel, } from '@mui/material';
import { TextField } from '@mui/material';
import FlagDetailDialog from '../FlagDetailDialog';
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

const getPriorityColor = (score) => {
  // Red for priority >7, warning for 4-7, success for <4
  if (score > 7) return 'error';      // Red for lowest priority (8-10)
  if (score >= 4 && score <= 7) return 'warning'; // Warning for medium priority (4-7)
  if (score < 4) return 'success';    // Green for highest priority (1-3)
  return 'default';
};

const getLifecycleColor = (stage) => {
  // Returns color for lifecycle stage
  switch (stage) {
    case 'Ready to Archive': return 'error';
    case 'Ready for Review': return 'warning';
    case 'Live': return 'success'; // green
    default: return 'default';
  }
};

const RecommendationsTable = ({ flags, loading, metrics = {}, highPriorityPercentage = 0 }) => {

  // State for pagination, sorting, flag detail dialog, and filters
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('owner');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  // Filter states
  const [filterOwner, setFilterOwner] = useState('');
  const [filterFlagName, setFilterFlagName] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterLifecycle, setFilterLifecycle] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTemporary, setFilterTemporary] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 50));
    setPage(0);
  };

  // Sorting helpers
  function descendingComparator(a, b, orderBy) {
    switch (orderBy) {
      case 'owner': {
        const aName = (a._maintainer?.firstName || '') + ' ' + (a._maintainer?.lastName || '');
        const bName = (b._maintainer?.firstName || '') + ' ' + (b._maintainer?.lastName || '');
        return bName.localeCompare(aName);
      }
      case 'flagName':
        return (b.name || '').localeCompare(a.name || '');
      case 'tag': {
        const aTag = Array.isArray(a.tags) && a.tags.length > 0 ? a.tags[0] : '';
        const bTag = Array.isArray(b.tags) && b.tags.length > 0 ? b.tags[0] : '';
        return bTag.localeCompare(aTag);
      }
      case 'age':
        return b.ageDays - a.ageDays;
      case 'lifecycleStage': {
        const aStage = Array.isArray(a.lifecycleStage) ? a.lifecycleStage[0] : a.lifecycleStage;
        const bStage = Array.isArray(b.lifecycleStage) ? b.lifecycleStage[0] : b.lifecycleStage;
        return (bStage || '').localeCompare(aStage || '');
      }
      case 'priority':
        return b.priorityScore - a.priorityScore;
      case 'temporary':
        return (b.temporary === a.temporary) ? 0 : b.temporary ? 1 : -1;
      default:
        return 0;
    }
  }

  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const cmp = comparator(a[0], b[0]);
      if (cmp !== 0) return cmp;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };



  // Filtering logic
  const filteredFlags = flags.filter(flag => {
    // Owner filter (case-insensitive substring)
    const ownerName = ((flag._maintainer?.firstName || '') + ' ' + (flag._maintainer?.lastName || '')).toLowerCase();
    if (filterOwner && !ownerName.includes(filterOwner.toLowerCase())) return false;

    // Flag Name filter (case-insensitive substring)
    if (filterFlagName && !(flag.name || '').toLowerCase().includes(filterFlagName.toLowerCase())) return false;

    // Tag filter (case-insensitive substring, any tag)
    if (filterTag && !(Array.isArray(flag.tags) && flag.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())))) return false;

    // Age filter (substring match)
    if (filterAge && !String(flag.ageDays).toLowerCase().includes(filterAge.toLowerCase())) return false;

    // Lifecycle filter (case-insensitive substring)
    const lifecycle = Array.isArray(flag.lifecycleStage) ? flag.lifecycleStage[0] : flag.lifecycleStage;
    if (filterLifecycle && !(String(lifecycle || '').toLowerCase().includes(filterLifecycle.toLowerCase()))) return false;

    // Priority filter (substring match)
    if (filterPriority && !String(flag.priorityScore).toLowerCase().includes(filterPriority.toLowerCase())) return false;

    // Temporary filter (case-insensitive substring: 'yes'/'no')
    const tempLabel = flag.temporary ? 'yes' : 'no';
    if (filterTemporary && !tempLabel.toLowerCase().includes(filterTemporary.toLowerCase())) return false;

    return true;
  });

  // Show all flags passed in props (Live, Ready to Archive, Ready for Review)
  const sortedFlags = stableSort(filteredFlags, getComparator(order, orderBy));
  const paginatedFlags = sortedFlags.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ width: '100%' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'owner' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'owner'}
                  direction={orderBy === 'owner' ? order : 'asc'}
                  onClick={() => handleRequestSort('owner')}
                >
                  Owner
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'flagName' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'flagName'}
                  direction={orderBy === 'flagName' ? order : 'asc'}
                  onClick={() => handleRequestSort('flagName')}
                >
                  Flag Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'tag' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'tag'}
                  direction={orderBy === 'tag' ? order : 'asc'}
                  onClick={() => handleRequestSort('tag')}
                >
                  Tag
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sortDirection={orderBy === 'age' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'age'}
                  direction={orderBy === 'age' ? order : 'asc'}
                  onClick={() => handleRequestSort('age')}
                >
                  Age (days)
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sortDirection={orderBy === 'lifecycleStage' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'lifecycleStage'}
                  direction={orderBy === 'lifecycleStage' ? order : 'asc'}
                  onClick={() => handleRequestSort('lifecycleStage')}
                >
                  Lifecycle Stage
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sortDirection={orderBy === 'priority' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'priority'}
                  direction={orderBy === 'priority' ? order : 'asc'}
                  onClick={() => handleRequestSort('priority')}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sortDirection={orderBy === 'temporary' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'temporary'}
                  direction={orderBy === 'temporary' ? order : 'asc'}
                  onClick={() => handleRequestSort('temporary')}
                >
                  Temporary
                </TableSortLabel>
              </TableCell>
            </TableRow>
            {/* Filter Row */}
            <TableRow>
              <TableCell>
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="Filter Owner"
                  value={filterOwner}
                  onChange={e => setFilterOwner(e.target.value)}
                  fullWidth
                  InputProps={{ style: { fontSize: 13 } }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="Filter Flag Name"
                  value={filterFlagName}
                  onChange={e => setFilterFlagName(e.target.value)}
                  fullWidth
                  InputProps={{ style: { fontSize: 13 } }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="Filter Tag"
                  value={filterTag}
                  onChange={e => setFilterTag(e.target.value)}
                  fullWidth
                  InputProps={{ style: { fontSize: 13 } }}
                />
              </TableCell>
              <TableCell align="center">
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="Age"
                  value={filterAge}
                  onChange={e => setFilterAge(e.target.value)}
                  inputProps={{ style: { fontSize: 13, textAlign: 'center' } }}
                  sx={{ width: '80%' }}
                />
              </TableCell>
              <TableCell align="center">
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="Lifecycle"
                  value={filterLifecycle}
                  onChange={e => setFilterLifecycle(e.target.value)}
                  sx={{ width: '90%' }}
                  InputProps={{ style: { fontSize: 13 } }}
                />
              </TableCell>
              <TableCell align="center">
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="Priority"
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  inputProps={{ style: { fontSize: 13, textAlign: 'center' } }}
                  sx={{ width: '80%' }}
                />
              </TableCell>
              <TableCell align="center">
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="Temporary"
                  value={filterTemporary}
                  onChange={e => setFilterTemporary(e.target.value)}
                  sx={{ width: '90%' }}
                  InputProps={{ style: { fontSize: 13 } }}
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFlags.map((flag) => {
              // Determine row color by priority
              let rowBg = '';
              if (flag.priorityScore >= 7) {
                rowBg = 'rgba(255, 56, 56, 0.08)'; // High priority: light red
              } else if (flag.priorityScore >= 4) {
                rowBg = 'rgba(255, 215, 0, 0.10)'; // Medium priority: light yellow
              }
              return (
                <TableRow key={flag.key} hover sx={rowBg ? { background: rowBg } : {}}>
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
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => { setSelectedFlag(flag); setDialogOpen(true); }}
                      >
                        {flag.name || 'No name'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {Array.isArray(flag.tags) && flag.tags.length > 0 ? (
                        flag.tags.length === 1 ? (
                          <Chip
                            key={flag.tags[0]}
                            label={flag.tags[0]}
                            size="small" />
                        ) : (
                          <Tooltip title={flag.tags.slice(1).join(', ')} arrow>
                            <Chip
                              key={flag.tags[0]}
                              label={flag.tags[0] + ' +' + (flag.tags.length - 1)}
                              size="small" />
                          </Tooltip>
                        )
                      ) : (
                        <Chip label="No tags" size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {flag.ageDays}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {Array.isArray(flag.lifecycleStage) ? (
                      flag.lifecycleStage.length === 1 ? (
                        <Chip label={flag.lifecycleStage[0]} color={getLifecycleColor(flag.lifecycleStage[0])} size="small" />
                      ) : (
                        <Tooltip title={flag.lifecycleStage.slice(1).join(', ')} >
                          <Chip
                            label={flag.lifecycleStage[0] + ' +' + (flag.lifecycleStage.length - 1)}
                            color={getLifecycleColor(flag.lifecycleStage[0])}
                            size="small" />
                        </Tooltip>
                      )
                    ) : (
                      <Chip label={flag.lifecycleStage} color={getLifecycleColor(flag.lifecycleStage)} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${flag.priorityScore}/10`}
                      color={getPriorityColor(flag.priorityScore)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={flag.temporary ? 'Yes' : 'No'}
                      color={flag.temporary ? 'warning' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {/* Archive action removed */}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={flags.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <FlagDetailDialog open={dialogOpen} flag={selectedFlag} onClose={() => setDialogOpen(false)} />
    </Paper>
  );
};

export default RecommendationsTable;
