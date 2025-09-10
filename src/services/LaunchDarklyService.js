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
        // Fetches all flags for the given project, paginated. If includeArchived is true, fetch both active and archived flags and merge them.
        try {
            const limit = 100;
            // Helper to fetch flags for a given archived param
            const fetchByArchived = async (archivedValue) => {
                let flags = [];
                let offset = 0;
                let totalCount = null;
                do {
                    const response = await this.client.get(`/flags/${this.projectKey}?limit=${limit}&offset=${offset}&archived=${archivedValue}`);
                    const data = response.data;
                    if (data.items) {
                        flags = flags.concat(data.items);
                    }
                    totalCount = data.totalCount || (data.items ? data.items.length : 0);
                    offset += limit;
                    if (!data.items || data.items.length < limit) break;
                } while (flags.length < totalCount && flags.length < 500);
                return flags;
            };

            if (includeArchived) {
                // Fetch both active and archived flags, then merge
                const [activeFlags, archivedFlags] = await Promise.all([
                    fetchByArchived(false),
                    fetchByArchived(true)
                ]);
                // Merge and deduplicate by flag key
                const all = [...activeFlags, ...archivedFlags];
                const deduped = Object.values(all.reduce((acc, flag) => {
                    acc[flag.key] = flag;
                    return acc;
                }, {}));
                return { items: deduped };
            } else {
                // Only fetch active flags
                const activeFlags = await fetchByArchived(false);
                return { items: activeFlags };
            }
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
