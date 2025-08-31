import React, { useState } from 'react';
// ---------------------------------------------
// CleanupRecommendationsTable: Table of flags needing cleanup
// ---------------------------------------------
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Box,
  Avatar,
} from '@mui/material';
import { Archive, CheckCircle } from '@mui/icons-material';
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
// Returns color for priority score
  if (score >= 7) return 'error';
  if (score >= 4) return 'warning';
  return 'success';
};

const getLifecycleColor = (stage) => {
// Returns color for lifecycle stage
  switch (stage) {
    case 'Ready to Archive': return 'error';
    case 'Ready for Review': return 'warning';
    case 'Live': return 'success';
    default: return 'default';
  }
};

const CleanupRecommendationsTable = ({ flags, onArchive, loading }) => {
  // State for pagination and archive dialog
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [archiveDialog, setArchiveDialog] = useState({ open: false, flag: null });

  const handleArchiveClick = (flag) => {
  // Opens archive confirmation dialog
    setArchiveDialog({ open: true, flag });
  };

  const handleArchiveConfirm = () => {
  // Archives selected flag
    if (archiveDialog.flag) {
      onArchive(archiveDialog.flag.key);
    }
    setArchiveDialog({ open: false, flag: null });
  };

  const handleChangePage = (event, newPage) => {
  // Handles table page change
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
  // Handles change in rows per page
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!flags || flags.length === 0) {
  // Show message if no flags need cleanup
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cleanup Recommendations
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="success.main">
            No flags require cleanup attention!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All flags are properly maintained.
          </Typography>
        </Box>
      </Paper>
    );
  }

  const paginatedFlags = flags.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  // Paginate flags for table display
  // Render table of flags needing cleanup

  return (
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <Typography variant="h6" gutterBottom>
          Cleanup Recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {flags.length} flags require attention
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Tag</TableCell>
              <TableCell align="center">Age (days)</TableCell>
              <TableCell align="center">Lifecycle Stage</TableCell>
              <TableCell align="center">Priority</TableCell>
              <TableCell align="center">Temporary</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFlags.map((flag) => {
              return (
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
                  <TableCell align="center">
                    <Typography variant="body2">
                      {flag.ageDays}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {Array.isArray(flag.lifecycleStage) ? (
                      flag.lifecycleStage.length === 1 ? (
                        <Chip label={flag.lifecycleStage[0]} color={getLifecycleColor(flag.lifecycleStage[0])} size="small" sx={{ color: '#fff', fontWeight: 700 }} />
                      ) : (
                        <Tooltip title={flag.lifecycleStage.slice(1).join(', ')} arrow>
                          <Chip
                            label={flag.lifecycleStage[0] + ' +' + (flag.lifecycleStage.length - 1)}
                            color={getLifecycleColor(flag.lifecycleStage[0])}
                            size="small"
                            sx={{ color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                          />
                        </Tooltip>
                      )
                    ) : (
                      <Chip label={flag.lifecycleStage} color={getLifecycleColor(flag.lifecycleStage)} size="small" sx={{ color: '#fff', fontWeight: 700 }} />
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
                    <Tooltip title="Archive flag">
                      <IconButton
                        color="error"
                        onClick={() => handleArchiveClick(flag)}
                        disabled={loading}
                        size="small"
                      >
                        <Archive />
                      </IconButton>
                    </Tooltip>
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
      {/* Archive Confirmation Dialog */}
      <Dialog
        open={archiveDialog.open}
        onClose={() => setArchiveDialog({ open: false, flag: null })}
      >
        <DialogTitle>Archive Flag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to archive the flag "{archiveDialog.flag?.key}"?
            This action cannot be undone from this interface.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialog({ open: false, flag: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleArchiveConfirm} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CleanupRecommendationsTable;
