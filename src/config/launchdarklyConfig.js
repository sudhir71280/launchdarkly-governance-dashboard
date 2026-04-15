// config/launchdarklyConfig.js
// Combined config for LaunchDarkly API tokens and project keys

export const launchdarklyConfig = {
    apiTokens: [
        { label: 'LaunchDarkly', value: process.env.REACT_APP_LD_API_TOKEN || ''}
    ] 
};
