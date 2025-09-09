// src/utils/flagUtils.js
// Utility to export dashboard metrics and cleanup candidates to a single CSV for Excel

export function exportDashboardAndCleanupToCSV(metrics, cleanupCandidates) {
    // Dashboard summary section
    const dashboardRows = [
        ['Metric', 'Count'],
        ['Total Flags', metrics.totalFlags || 0],
        ['Live Flags', metrics.lifecycleStages?.Live || 0],
        ['Ready to Review', metrics.lifecycleStages?.['Ready for Review'] || 0],
        ['Ready to Archive', metrics.lifecycleStages?.['Ready to Archive'] || 0],
        ['Archived', metrics.lifecycleStages?.Archived || 0],
        '',
        ['Age Distribution'],
        ['0-30 days', metrics.ageDistribution?.['0-30'] || 0],
        ['31-90 days', metrics.ageDistribution?.['31-90'] || 0],
        ['91-180 days', metrics.ageDistribution?.['91-180'] || 0],
        ['180+ days', metrics.ageDistribution?.['180+'] || 0],
        '',
        ['Cleanup Candidates Table'],
    ];

    // Cleanup candidates table section
    const cleanupHeaders = [
        'Name',
        'Maintainer',
        'Tags',
        'Age (days)',
        'Lifecycle Stage',
        'Priority Score',
        'Temporary',
    ];
    const cleanupRows = cleanupCandidates.map(flag => [
        flag.name,
        `${flag._maintainer?.firstName || ''} ${flag._maintainer?.lastName || ''}`.trim(),
        flag.tags?.join('|') || 'No tags',
        flag.ageDays,
        flag.lifecycleStage,
        flag.priorityScore,
        flag.temporary ? 'Yes' : 'No',
    ]);

    // Combine all rows
    const allRows = [
        ...dashboardRows,
        cleanupHeaders,
        ...cleanupRows
    ];
    return allRows.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
}
