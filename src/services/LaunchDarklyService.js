import axios from 'axios';

export class LaunchDarklyService {
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

  async fetchFlags() {
    try {
      let allFlags = [];
      let offset = 0;
      let totalCount = null;
      const limit = 100;
      do {
        const response = await this.client.get(`/flags/${this.projectKey}?limit=${limit}&offset=${offset}`);
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
      // Remove console.error to avoid warnings in console
      throw new Error(`Failed to fetch flags: ${error.response?.data?.message || error.message}`);
    }
  }

  async archiveFlag(flagKey) {
    try {
      const patchData = [
        {
          op: 'replace',
          path: '/archived',
          value: true,
        },
      ];

      const response = await this.client.patch(`/flags/${this.projectKey}/${flagKey}`, patchData);
      return response.data;
    } catch (error) {
      // Remove console.error to avoid warnings in console
      throw new Error(`Failed to archive flag: ${error.response?.data?.message || error.message}`);
    }
  }

  async getFlagDetails(flagKey) {
    try {
      const response = await this.client.get(`/flags/${this.projectKey}/${flagKey}`);
      return response.data;
    } catch (error) {
      // Remove console.error to avoid warnings in console
      throw new Error(`Failed to get flag details: ${error.response?.data?.message || error.message}`);
    }
  }

  async bulkArchiveFlags(flagKeys) {
    const results = [];
    
    for (const flagKey of flagKeys) {
      try {
        await this.archiveFlag(flagKey);
        results.push({ flagKey, success: true });
      } catch (error) {
        // Do not log error to console, just record in results
        results.push({ flagKey, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

export default LaunchDarklyService;
