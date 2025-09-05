import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const FlagGovernanceStandards = () => (
    <Box sx={{ p: { xs: 1, md: 1 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 2, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <span role="img" aria-label="governance" style={{ fontSize: 32 }}>🛡️</span>
            LaunchDarkly Flags Cleanup Process
        </Typography>
        <Box sx={{ flexGrow: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Paper elevation={3} sx={{ flex: 1, p: { xs: 2, md: 4 }, background: 'linear-gradient(90deg, #e3f2fd 80%, #fff 100%)', borderRadius: 4, mb: { xs: 2, md: 0 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#c62828', mb: 1, fontSize: '1.15rem', letterSpacing: 0.5 }}>
                        Problem Statement —
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#333', fontSize: '1.08rem', lineHeight: 1.7 }}>
                        <span style={{ color: '#1976d2', fontWeight: 600 }}>Frequent flag creation</span> but <span style={{ color: '#c62828', fontWeight: 600 }}>limited cleanup</span> leads to <span style={{ color: '#c62828', fontWeight: 600 }}>unused or outdated flags</span>, making the codebase harder to manage and slowing development.<br />
                        The accumulation also introduces risks such as <span style={{ color: '#c62828', fontWeight: 600 }}>unexpected behaviors during releases</span>, potentially affecting <span style={{ fontWeight: 600 }}>application stability</span> and <span style={{ fontWeight: 600 }}>reliability</span>.
                    </Typography>
                </Paper>
                <Paper elevation={3} sx={{ flex: 1, p: { xs: 2, md: 4 }, background: 'linear-gradient(90deg, #fffde7 80%, #fff 100%)', borderRadius: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ff9800', mb: 1, fontSize: '1.12rem', letterSpacing: 0.5 }}>
                        Solution Overview —
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#333', fontSize: '1.08rem', lineHeight: 1.7 }}>
                        To mitigate these challenges, we need a <span style={{ color: '#1976d2', fontWeight: 600 }}>structured governance process</span> —that continuously <span style={{ fontWeight: 600 }}>reviews</span>, <span style={{ fontWeight: 600 }}>retires</span>, or <span style={{ fontWeight: 600 }}>archives</span> flags as appropriate.<br />
                        This will provide <span style={{ color: '#1976d2', fontWeight: 600 }}>greater visibility and control</span>, <span style={{ color: '#388e3c', fontWeight: 600 }}>reduce technical debt</span>, <span style={{ color: '#c62828', fontWeight: 600 }}>minimize release risks</span>, and ultimately <span style={{ color: '#388e3c', fontWeight: 600 }}>improve delivery speed and quality</span>.
                    </Typography>
                </Paper>
            </Box>
        </Box>
        {/* Show the chart image directly on the page */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
            <img src="/mermaidchart/mermaidChartHorizontal.png" alt="Flag Lifecycle Chart" height="100%" width="98%" style={{ borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }} />
        </Box>
    </Box>
);

export default FlagGovernanceStandards;
