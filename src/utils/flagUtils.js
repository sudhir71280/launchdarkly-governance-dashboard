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

    if (flag.archived) {
      metrics.archivedFlags++;
    } else {
      if (flag.temporary) metrics.temporaryFlags++;
      else metrics.permanentFlags++;
      if (ageDays <= 30) metrics.ageDistribution['0-30']++;
      else if (ageDays <= 90) metrics.ageDistribution['31-90']++;
      else if (ageDays <= 180) metrics.ageDistribution['91-180']++;
      else metrics.ageDistribution['180+']++;
      metrics.flagTypes[flag.kind] = (metrics.flagTypes[flag.kind] || 0) + 1;
      metrics.lifecycleStages[lifecycleStage] = (metrics.lifecycleStages[lifecycleStage] || 0) + 1;
      if (lifecycleStage === 'Ready to Archive' || priorityScore >= 7) {
        if (lifecycleStage === 'Ready to Archive') metrics.readyToArchive++;
        if (priorityScore >= 7) metrics.highPriority++;
        metrics.cleanupCandidates.push(analyzedFlag);
      }
    }
  });

  metrics.cleanupCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
  const alerts = generateAlerts(metrics);
  return { flags: analyzedFlags, metrics, alerts };
}

export function determineLifecycleStage(flag, ageDays) {
  if (flag.archived) return 'Archived';
  if (ageDays < 30) return 'Live';
  if (ageDays >= 30 && flag.temporary) return 'Ready for Review';
  if (ageDays >= 90 && flag.temporary) return 'Ready to Archive';
  return 'Permanent';
}

export function calculatePriorityScore(flag, ageDays) {
  let score = 1;
  if (ageDays > 180) score += 4;
  else if (ageDays > 90) score += 3;
  else if (ageDays > 30) score += 2;
  if (flag.temporary) score += 2;
  const envCount = Object.keys(flag.environments || {}).length;
  if (envCount <= 2) score += 2;
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
