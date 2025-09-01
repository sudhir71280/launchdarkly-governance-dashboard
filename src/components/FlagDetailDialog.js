import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

const FlagDetailDialog = ({ open, flag, onClose }) => {
    console.log('FlagDetailDialog render', { json: JSON.stringify(flag) });
  if (!flag) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 600, fontSize: 22, letterSpacing: 1 }}>
        Flag Details
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f5f7fa', p: 3 }}>
        {/* Metadata */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>{String(flag.name || 'No name')}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>Key: <b>{String(flag.key)}</b></Typography>
          {flag.description && (
            <Typography variant="body2" sx={{ mb: 1 }}>{String(flag.description)}</Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2">Kind: <b>{String(flag.kind)}</b></Typography>
            <Typography variant="body2">Version: <b>{String(flag._version)}</b></Typography>
            <Typography variant="body2">Archived: <b>{flag.archived ? 'Yes' : 'No'}</b></Typography>
            <Typography variant="body2">Deprecated: <b>{flag.deprecated ? 'Yes' : 'No'}</b></Typography>
            <Typography variant="body2">Temporary: <b>{flag.temporary ? 'Yes' : 'No'}</b></Typography>
            <Typography variant="body2">Include in Snippet: <b>{flag.includeInSnippet ? 'Yes' : 'No'}</b></Typography>
          </Box>
        </Box>
        {/* Maintainer */}
        {flag._maintainer && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Maintainer</Typography>
            <Typography variant="body2">{String(flag._maintainer.firstName)} {String(flag._maintainer.lastName)} (<b>{String(flag._maintainer.email)}</b>)</Typography>
            <Typography variant="body2">Role: <b>{String(flag._maintainer.role)}</b></Typography>
          </Box>
        )}
        {/* Tags */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Tags</Typography>
          <Typography variant="body2">
            {Array.isArray(flag.tags) && flag.tags.length > 0 ? flag.tags.join(', ') : 'No tags'}
          </Typography>
        </Box>
        {/* Dates */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1, display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Created</Typography>
            <Typography variant="body2">{flag.creationDate ? String(new Date(flag.creationDate).toLocaleString()) : '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Age (days)</Typography>
            <Typography variant="body2">{String(flag.ageDays)}</Typography>
          </Box>
        </Box>
        {/* Lifecycle & Priority */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1, display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Lifecycle Stage</Typography>
            <Typography variant="body2">{Array.isArray(flag.lifecycleStage) ? flag.lifecycleStage.join(', ') : String(flag.lifecycleStage)}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Priority</Typography>
            <Typography variant="body2">{String(flag.priorityScore)}/10</Typography>
          </Box>
        </Box>
        {/* Variations */}
        {flag.variations && Array.isArray(flag.variations) && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Variations</Typography>
            {flag.variations.map((v, idx) => (
              <Box key={idx} sx={{ ml: 2, mb: 1, p: 1, bgcolor: '#f5f7fa', borderRadius: 1 }}>
                <Typography variant="body2">Value: <b>{String(v.value)}</b></Typography>
                {v.name && <Typography variant="body2">Name: <b>{String(v.name)}</b></Typography>}
                {v.description && <Typography variant="caption" color="text.secondary">{String(v.description)}</Typography>}
              </Box>
            ))}
          </Box>
        )}
        {/* Defaults */}
        {flag.defaults && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Defaults</Typography>
            <Typography variant="body2">On Variation: <b>{String(flag.defaults.onVariation)}</b></Typography>
            <Typography variant="body2">Off Variation: <b>{String(flag.defaults.offVariation)}</b></Typography>
          </Box>
        )}
        {/* Client Side Availability */}
        {flag.clientSideAvailability && (
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Client Side Availability</Typography>
            <Typography variant="body2">Using Environment ID: <b>{flag.clientSideAvailability.usingEnvironmentId ? 'Yes' : 'No'}</b></Typography>
            <Typography variant="body2">Using Mobile Key: <b>{flag.clientSideAvailability.usingMobileKey ? 'Yes' : 'No'}</b></Typography>
          </Box>
        )} 
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#f5f7fa' }}>
        <Button onClick={onClose} color="primary" variant="contained" sx={{ fontWeight: 600, px: 4 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlagDetailDialog;
