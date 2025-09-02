// src/utils/flagUtils.js
// Utility functions for flag analysis, lifecycle, priority, alerts, and CSV export

export function analyzeFlags(flags) {
    const currentTime = new Date();
    const analyzedFlags = [];
    const metrics = {
        totalFlags: flags.length,
        temporaryFlags: 0,
        permanentFlags: 0,
        archivedFlags: 0,
        readyToArchive: 0,
        highPriority: 0,
        ageDistribution: { '0-30': 0, '31-90': 0, '91-180': 0, '180+': 0 },
        flagTypes: {},
        lifecycleStages: {},
        cleanupCandidates: [],
    };

    flags.forEach((flag) => {
        const creationDate = new Date(flag.creationDate);
        const ageDays = Math.floor((currentTime - creationDate) / (1000 * 60 * 60 * 24));
        const lifecycleStage = determineLifecycleStage(flag, ageDays);
        const priorityScore = calculatePriorityScore(flag, ageDays);
        const analyzedFlag = {
            ...flag,
            ageDays,
            creationDate,
            lifecycleStage,
            priorityScore,
        };
        analyzedFlags.push(analyzedFlag);

        // Debug log for lifecycleStage and priorityScore
        if (typeof window !== 'undefined') {
            console.log('Flag:', {
                name: flag.name,
                lifecycleStage: analyzedFlag.lifecycleStage,
                priorityScore: analyzedFlag.priorityScore
            });
        }

        if (flag.archived) {
            metrics.archivedFlags++;
        } else {
            if (flag.temporary) {
                metrics.temporaryFlags++;
            }
            else {
                metrics.permanentFlags++;
            }
            if (ageDays <= 30) {
                metrics.ageDistribution['0-30']++;
            }
            else if (ageDays <= 90) {
                metrics.ageDistribution['31-90']++;
            }
            else if (ageDays <= 180) {
                metrics.ageDistribution['91-180']++;
            }
            else {
                metrics.ageDistribution['180+']++;
            }
            // Track flag type and lifecycle stage counts
            metrics.flagTypes[flag.kind] = (metrics.flagTypes[flag.kind] || 0) + 1;
            metrics.lifecycleStages[lifecycleStage] = (metrics.lifecycleStages[lifecycleStage] || 0) + 1;

            // --- Cleanup Candidate Logic ---
            // A flag is a cleanup candidate if:
            //   - Its lifecycleStage is 'Ready for Archive' OR 'Ready for Review' (case-insensitive, locale-invariant)
            //   - OR its priorityScore is 7 or higher
            // This ensures we catch both explicit and high-priority flags.
            const isReadyToArchive =
                typeof lifecycleStage === 'string' &&
                lifecycleStage.trim().localeCompare('Ready to Archive', undefined, { sensitivity: 'base' }) === 0;
            const isReadyForReview =
                typeof lifecycleStage === 'string' &&
                lifecycleStage.trim().localeCompare('Ready for Review', undefined, { sensitivity: 'base' }) === 0;
            const isHighPriority = priorityScore >= 7;

            if (isReadyToArchive || isReadyForReview || isHighPriority) {
                // Track metrics for dashboard cards and alerts
                if (isReadyToArchive) metrics.readyToArchive++;
                if (isHighPriority) metrics.highPriority++;
                // Add to cleanup candidates list for table display
                metrics.cleanupCandidates.push(analyzedFlag);
            }
        }
    });

    metrics.cleanupCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
    const alerts = generateAlerts(metrics);
    return { flags: analyzedFlags, metrics, alerts };
}

export function determineLifecycleStage(flag, ageDays) {
    // Determine lifecycle stage for a feature flag
    // 1. Archived flags are always 'Archived'
    if (flag.archived) return 'Archived';

    // 2. Temporary flags have staged lifecycle
    if (flag.temporary) {
        if (ageDays < 30) {
            return 'Live'; // Recently created temporary flag
        } else if (ageDays < 90) {
            return 'Ready for Review'; // Temporary flag, review after 30 days
        } else {
            return 'Ready to Archive'; // Temporary flag, archive after 90 days
        }
    }

    // 3. Permanent flags
    if (ageDays < 30) {
        return 'Live'; // Recently created permanent flag
    } else {
        return 'Permanent'; // Permanent flag, older than 30 days
    }
}

export function calculatePriorityScore(flag, ageDays) {
    // Priority scoring breakdown:
    // - Age: Older flags are higher priority for cleanup
    // - Temporary: Temporary flags are higher priority
    // - Environment count: Fewer environments means easier cleanup

    let score = 0;

    // Age scoring
    // 0-30 days: 0 points (new flag)
    // 31-90 days: +2 points
    // 91-180 days: +4 points
    // >180 days: +6 points
    if (ageDays > 180) {
        score += 6;
    } else if (ageDays > 90) {
        score += 4;
    } else if (ageDays > 30) {
        score += 2;
    }

    // Temporary flag bonus
    // Temporary flags are more likely to be cleanup candidates
    if (flag.temporary) {
        score += 2;
    }

    // Environment count bonus
    // Flags in 2 or fewer environments are easier to clean up
    const envCount = Object.keys(flag.environments || {}).length;
    if (envCount > 0 && envCount <= 2) {
        score += 2;
    }

    // Cap score at 10 for dashboard consistency
    console.log(`Calculated priority score for flag ${flag.name}: ${score}`);
    return Math.min(score, 10);
}

export function generateAlerts(metrics) {
    const alerts = [];
    if (metrics.highPriority > 10) {
        alerts.push({
            level: 'HIGH',
            message: `${metrics.highPriority} flags require immediate attention`,
            type: 'cleanup',
        });
    }
    if (metrics.readyToArchive > 20) {
        alerts.push({
            level: 'MEDIUM',
            message: `${metrics.readyToArchive} flags are ready to archive`,
            type: 'cleanup',
        });
    }
    const activeFlags = metrics.totalFlags - metrics.archivedFlags;
    if (activeFlags > 500) {
        alerts.push({
            level: 'MEDIUM',
            message: `${activeFlags} active flags may impact performance`,
            type: 'performance',
        });
    }
    return alerts;
}

export function exportCleanupCandidatesToCSV(cleanupCandidates) {
    const csvData = cleanupCandidates.map(flag => ({
        'Name': flag.name,
        'Maintainer': `${flag._maintainer?.firstName || ''} ${flag._maintainer?.lastName || ''}`,
        'Tags': flag.tags?.join('|') || 'No tags',
        'Age (days)': flag.ageDays,
        'Lifecycle Stage': flag.lifecycleStage,
        'Priority Score': flag.priorityScore,
        'Temporary': flag.temporary,
    }));
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
}
