// src/utils/flagUtils.js
// Utility functions for flag analysis, lifecycle, priority, alerts, and CSV export

export function analyzeFlags(flags) {
    const currentTime = new Date();
    const analyzedFlags = [];
    const metrics = {
        totalFlags: flags.length,
        ageDistribution: { '0-30': 0, '31-90': 0, '91-180': 0, '180+': 0 },
        lifecycleStages: {
            'Ready to Archive': 0,
            'Ready for Review': 0,
        },
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

        // Only count Ready to Archive and Ready for Review lifecycle stages
        if (lifecycleStage === 'Ready to Archive' || lifecycleStage === 'Ready for Review' || lifecycleStage === 'Live') {
            metrics.lifecycleStages[lifecycleStage] = (metrics.lifecycleStages[lifecycleStage] || 0) + 1;
        }

        // --- Cleanup Candidate Logic ---
        // A flag is a cleanup candidate if:
        //   - Its lifecycleStage is 'Ready to Archive' (case-insensitive, locale-invariant)
        //   - OR its lifecycleStage is 'Ready for Review' (case-insensitive, locale-invariant)
        // This ensures we catch both explicit cleanup stages.
        const isReadyToArchive = typeof lifecycleStage === 'string' && lifecycleStage.trim().localeCompare('Ready to Archive', undefined, { sensitivity: 'base' }) === 0;
        const isReadyForReview = typeof lifecycleStage === 'string' && lifecycleStage.trim().localeCompare('Ready for Review', undefined, { sensitivity: 'base' }) === 0;
        if (isReadyToArchive || isReadyForReview) {
            // Add to cleanup candidates list for table display
            metrics.cleanupCandidates.push(analyzedFlag);
        }
    });

    metrics.cleanupCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

    return { flags: analyzedFlags, metrics };
}

export function determineLifecycleStage(flag, ageDays) {
    // Determine lifecycle stage for a feature flag
    // 1. Archived flags are always 'Archived'
    if (flag.archived) {
        return 'Archived';
    }

    // 2. Flags lifecycle

    if (flag.tags && flag.tags.includes('ReadyToArchive')) {
        return 'Ready to Archive';
    }
    else {
        if (ageDays <= 30) {
            return 'Live'; // Recently created temporary flag
        } else {
            return 'Ready for Review'; // Temporary flag, review after 30 days
        }
    }
}

export function calculatePriorityScore(flag, ageDays) {
    // Priority scoring breakdown:
    // - Age: Older flags are higher priority for cleanup
    // - Temporary: Temporary flags are higher priority
    // - Environment count: Fewer environments means easier cleanup

    let score = 0;

    if (flag.tags && flag.tags.includes('ReadyToArchive')) {
        score += 10;
    }

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
    return Math.min(score, 10);
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
