import axios from 'axios';
// ---------------------------------------------
// LaunchDarklyService: Handles API interactions
// ---------------------------------------------

export class LaunchDarklyService {
    // Constructor sets up API credentials and axios client
    constructor(apiToken, projectKey, baseUrl = 'https://app.launchdarkly.com/api/v2') {
        this.apiToken = apiToken;
        this.projectKey = projectKey;
        this.baseUrl = baseUrl;

        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': apiToken,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }

    async fetchFlags({ includeArchived = false } = {}) {
        // Fetches all flags for the given project, paginated. Optionally includes archived flags.
        try {
            let allFlags = [];
            let offset = 0;
            let totalCount = null;
            const limit = 100;
            const archivedParam = includeArchived ? '&archived=true' : '';
            do {
                const response = await this.client.get(`/flags/${this.projectKey}?limit=${limit}&offset=${offset}${archivedParam}`);
                const data = response.data;
                if (data.items) {
                    allFlags = allFlags.concat(data.items);
                }
                totalCount = data.totalCount || (data.items ? data.items.length : 0);
                offset += limit;
                // If API does not return totalCount, break when less than limit returned
                if (!data.items || data.items.length < limit) break;
            } while (allFlags.length < totalCount && allFlags.length < 500);
            return { items: allFlags };
        } catch (error) {
            throw new Error(`Failed to fetch flags: ${error.response?.data?.message || error.message}`);
        }
    }

    async getFlagDetails(flagKey) {
        // Fetches details for a single flag
        try {
            const response = await this.client.get(`/flags/${this.projectKey}/${flagKey}`);
            return response.data;
        } catch (error) {
            // Remove console.error to avoid warnings in console
            throw new Error(`Failed to get flag details: ${error.response?.data?.message || error.message}`);
        }
    }

    async fetchProjects() {
        // Fetches up to 200 projects from LaunchDarkly
        try {
            const response = await this.client.get('/projects?limit=200');
            return response.data.items || [];
        } catch (error) {
            throw new Error(`Failed to fetch projects: ${error.response?.data?.message || error.message}`);
        }
    }
}

export default LaunchDarklyService;
