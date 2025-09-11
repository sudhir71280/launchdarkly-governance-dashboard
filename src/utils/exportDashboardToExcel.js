// src/utils/exportDashboardToExcel.js
// Utility to export dashboard metrics, agewise counts, and all flags to a multi-sheet Excel file
import * as XLSX from 'xlsx';

export function exportDashboardToExcel(metrics, flags, includeArchived) {
    // Sheet 1: Dashboard Counts
    const dashboardData = [
        ['Metric', 'Count'],
        ['Total Flags', metrics.totalFlags || 0],
        ['Live Flags', metrics.lifecycleStages?.Live || 0],
        ['Ready to Review', metrics.lifecycleStages?.['Ready for Review'] || 0],
        ['Ready to Archive', metrics.lifecycleStages?.['Ready to Archive'] || 0],
    ];

    if (includeArchived && metrics.lifecycleStages?.Archived !== undefined) {
        dashboardData.push(['Archived', metrics.lifecycleStages.Archived || 0]);
    }

    // Sheet 2: Agewise Flags Count
    const agewiseData = [
        ['Age Range', 'Count'],
        ['0-30 days', metrics.ageDistribution?.['0-30'] || 0],
        ['31-90 days', metrics.ageDistribution?.['31-90'] || 0],
        ['91-180 days', metrics.ageDistribution?.['91-180'] || 0],
        ['180+ days', metrics.ageDistribution?.['180+'] || 0],
    ];

    // Sheet 3: All Flags Data
    const flagHeaders = [
        'Name',
        'Key',
        'Maintainer',
        'Tags',
        'Age (days)',
        'Lifecycle Stage',
        'Priority Score',
        'Temporary',
        'Archived',
        'Creation Date',
    ];
    // Exclude archived flags from export
    const flagRows = flags.filter(f => !f.archived).map(flag => [
        flag.name,
        flag.key,
        `${flag._maintainer?.firstName || ''} ${flag._maintainer?.lastName || ''}`.trim(),
        flag.tags?.join('|') || 'No tags',
        flag.ageDays,
        flag.lifecycleStage,
        flag.priorityScore,
        flag.temporary ? 'Yes' : 'No',
        flag.archived ? 'Yes' : 'No',
        flag.creationDate ? new Date(flag.creationDate).toLocaleDateString() : '',
    ]);
    const allFlagsData = [flagHeaders, ...flagRows];

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();
    const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
    const wsAgewise = XLSX.utils.aoa_to_sheet(agewiseData);
    const wsAllFlags = XLSX.utils.aoa_to_sheet(allFlagsData);
    XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard');
    XLSX.utils.book_append_sheet(wb, wsAgewise, 'Flag Age Distribution');
    XLSX.utils.book_append_sheet(wb, wsAllFlags, 'All Flags');

    // Export to file
    XLSX.writeFile(wb, `flag_dashboard_report_${new Date().toISOString().split('T')[0]}.xlsx`);
}
