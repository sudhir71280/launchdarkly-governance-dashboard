// src/utils/flagUtils.js
// Utility functions for flag analysis, lifecycle CSV export

export function analyzeFlags(flags) {    
    const currentTime = new Date();
    const analyzedFlags = [];
    const metrics = {
        totalFlags: flags.length,
        ageDistribution: { '0-30': 0, '31-90': 0, '91-180': 0, '180+': 0 },
        lifecycleStages: {
            'Ready to Archive': 0,
            'Ready for Review': 0,
            'Live': 0,
        },
        cleanupCandidates: [],
    };

    flags.forEach((flag) => {
        const creationDate = new Date(flag.creationDate);
        const ageDays = Math.floor((currentTime - creationDate) / (1000 * 60 * 60 * 24));
        const lifecycleStage = determineLifecycleStage(flag, ageDays);
        const analyzedFlag = {
            ...flag,
            ageDays,
            creationDate,
            lifecycleStage
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
        
        // Count all relevant lifecycle stages
        if (lifecycleStage === 'Ready to Archive' || lifecycleStage === 'Ready for Review' || lifecycleStage === 'Live' || lifecycleStage === 'Archived') {
            metrics.lifecycleStages[lifecycleStage] = (metrics.lifecycleStages[lifecycleStage] || 0) + 1;
        }

        // --- Cleanup Candidate Logic ---
        // A flag is a cleanup candidate if:
        //   - Its lifecycleStage is 'Ready to Archive', 'Ready for Review', or 'Archived' (case-insensitive, locale-invariant)
        const isReadyToArchive = typeof lifecycleStage === 'string' && lifecycleStage.trim().localeCompare('Ready to Archive', undefined, { sensitivity: 'base' }) === 0;
        const isReadyForReview = typeof lifecycleStage === 'string' && lifecycleStage.trim().localeCompare('Ready for Review', undefined, { sensitivity: 'base' }) === 0;
        const isArchived = typeof lifecycleStage === 'string' && lifecycleStage.trim().localeCompare('Archived', undefined, { sensitivity: 'base' }) === 0;
        if (isReadyToArchive || isReadyForReview || isArchived) {
            // Add to cleanup candidates list for table display
            metrics.cleanupCandidates.push(analyzedFlag);
        }
    });

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


export function exportCleanupCandidatesToCSV(cleanupCandidates) {
    const csvData = cleanupCandidates.map(flag => ({
        'Name': flag.name,
        'Maintainer': `${flag._maintainer?.firstName || ''} ${flag._maintainer?.lastName || ''}`,
        'Tags': flag.tags?.join('|') || 'No tags',
        'Age (days)': flag.ageDays,
        'Lifecycle Stage': flag.lifecycleStage,
        'Temporary': flag.temporary,
    }));
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
}
