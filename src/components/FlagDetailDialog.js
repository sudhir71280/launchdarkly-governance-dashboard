import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Divider, Tooltip, Avatar } from '@mui/material';
import { Flag, CalendarToday, AccessTime, Label, Category, Star, Archive } from '@mui/icons-material';

const FlagDetailDialog = ({ open, flag, onClose, project = 'bff', lastUpdated = '' }) => {
    if (!flag) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            {/* Project Info Bar */}
            <Box sx={{ bgcolor: '#21244e', color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1, fontSize: 22, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag sx={{ fontSize: 32, mr: 1, color: '#ff9800' }} />
                    {String(flag.name || 'No name')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 18, color: '#fff', opacity: 0.85 }}>
                    Project: <b>{project}</b>
                </Typography>
            </Box>
            <DialogContent dividers sx={{ bgcolor: '#f5f7fa', p: 3 }}>
                {/* Metadata & Status */}
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, fontSize: 18 }}>
                            <Category sx={{ fontSize: 20, mr: 0.5, color: '#1976d2' }} />Key:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1976d2' }}>{String(flag.key)}</Typography>
                        {flag.archived && <Chip icon={<Archive sx={{ fontSize: 18 }} />} label="Archived" color="error" size="small" sx={{ ml: 2 }} />}
                        {flag.deprecated && <Chip label="Deprecated" color="warning" size="small" sx={{ ml: 1 }} />}
                        {flag.temporary && <Chip label="Temporary" color="warning" size="small" sx={{ ml: 1 }} />}
                    </Box>
                    {flag.description && (
                        <Typography variant="body2" sx={{ mb: 1, color: '#333', fontStyle: 'italic' }}>{String(flag.description)}</Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                        <Typography variant="body2">Kind: <b>{String(flag.kind)}</b></Typography>
                        <Typography variant="body2">Version: <b>{String(flag._version)}</b></Typography>
                        {/* Only show if true */}
                        {flag.includeInSnippet && <Chip label="In Snippet" color="info" size="small" />}
                    </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                {/* Modernized grouped details */}
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#f8fafc', boxShadow: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                        {/* Tags */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Label sx={{ fontSize: 18, color: '#1976d2' }} /> Tags
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                {Array.isArray(flag.tags) && flag.tags.length > 0
                                    ? flag.tags.map((tag, idx) => (
                                        <Chip key={idx} label={tag} color="info" size="small" variant="outlined" />
                                    ))
                                    : <Chip label="No tags" size="small" />}
                            </Box>
                        </Box>
                        {/* Created */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday sx={{ fontSize: 18, color: '#1976d2' }} /> Created
                            </Typography>
                            <Typography variant="body2">{flag.creationDate ? String(new Date(flag.creationDate).toLocaleString()) : '-'}</Typography>
                        </Box>
                        {/* Age */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime sx={{ fontSize: 18, color: '#1976d2' }} /> Age (days)
                            </Typography>
                            <Typography variant="body2">{String(flag.ageDays)}</Typography>
                        </Box>
                        {/* Lifecycle */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Category sx={{ fontSize: 18, color: '#1976d2' }} /> Lifecycle
                            </Typography>
                            {Array.isArray(flag.lifecycleStage)
                                ? flag.lifecycleStage.map((stage, idx) => (
                                    <Chip key={idx} label={stage} color={stage === 'Archived' ? 'error' : 'success'} size="small" sx={{ mr: 0.5 }} />
                                ))
                                : <Chip label={String(flag.lifecycleStage)} color={flag.lifecycleStage === 'Archived' ? 'error' : 'success'} size="small" />}
                        </Box>
                        {/* Priority */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Star sx={{ fontSize: 18, color: '#1976d2' }} /> Priority
                            </Typography>
                            <Chip label={`${String(flag.priorityScore)}/10`} color={flag.priorityScore >= 7 ? 'error' : flag.priorityScore >= 4 ? 'warning' : 'success'} size="small" />
                        </Box>
                    </Box>
                </Box>
                {/* Maintainer */}
                {flag._maintainer && (flag._maintainer.firstName || flag._maintainer.lastName || flag._maintainer.email || flag._maintainer.role) && (
                    <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {(flag._maintainer.firstName || flag._maintainer.lastName) ? (
                            <Avatar sx={{ bgcolor: '#1976d2', color: '#fff', width: 40, height: 40, fontWeight: 700 }}>
                                {flag._maintainer.firstName?.[0] || ''}{flag._maintainer.lastName?.[0] || ''}
                            </Avatar>
                        ) : null}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 0.5 }}>Maintainer</Typography>
                            <Typography variant="body2">
                                {(flag._maintainer.firstName || flag._maintainer.lastName)
                                    ? `${flag._maintainer.firstName || ''} ${flag._maintainer.lastName || ''}`.trim()
                                    : 'N/A'}
                                {flag._maintainer.email && (
                                    <> (<b>{flag._maintainer.email}</b>)</>
                                )}
                            </Typography>
                            {flag._maintainer.role && (
                                <Typography variant="body2">Role: <b>{flag._maintainer.role}</b></Typography>
                            )}
                        </Box>
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
