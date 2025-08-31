import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Archive,
  CheckCircle,
} from '@mui/icons-material';

const getPriorityColor = (score) => {
  if (score >= 7) return 'error';
  if (score >= 4) return 'warning';
  return 'success';
};

const getLifecycleColor = (stage) => {
  switch (stage) {
    case 'Ready to Archive': return 'error';
    case 'Ready for Review': return 'warning';
    case 'Live': return 'success';
    default: return 'default';
  }
};

const CleanupRecommendationsTable = ({ flags, onArchive, loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [archiveDialog, setArchiveDialog] = useState({ open: false, flag: null });

  const handleArchiveClick = (flag) => {
    setArchiveDialog({ open: true, flag });
  };

  const handleArchiveConfirm = () => {
    if (archiveDialog.flag) {
      onArchive(archiveDialog.flag.key);
    }
    setArchiveDialog({ open: false, flag: null });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!flags || flags.length === 0) {
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

  return (
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ p: 3, pb: 0 }}>
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
                    <Typography variant="body2">
                      {flag.name || 'No name'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {flag.ageDays}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={flag.lifecycleStage}
                      color={getLifecycleColor(flag.lifecycleStage)}
                      size="small"
                    />
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
