import { SearchResponse } from './types';

const API_BASE_URL =
  process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL ||
  window._env_?.REACT_APP_ACTION_MANAGER_BACKEND_URL ||
  'http://localhost:6081';

/**
 * Search service for action search API calls
 */
export class SearchService {
  /**
   * Search actions by query string
   * @param query Search query (minimum 2 characters)
   * @param pageIndex Page index (0-based)
   * @param pageSize Number of results per page
   * @returns Promise with search results
   */
  static async searchActions(
    query: string,
    pageIndex: number = 0,
    pageSize: number = 10
  ): Promise<SearchResponse> {
    if (query.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const params = new URLSearchParams({
      search: query,
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/v1/actions/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in');
      }
      if (response.status === 403) {
        throw new Error('Access denied - insufficient permissions');
      }
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data as SearchResponse;
  }
}
