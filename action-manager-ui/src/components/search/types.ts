/**
 * Type definitions for Search functionality
 */

/**
 * Action search result item
 * Matches ActionOverviewDTO from backend
 */
export interface SearchResult {
  name: string;
  hash: string;
  actionStatus: string;
  numberOfJobs: number;
  numberOfFailureJobs: number;
  numberOfSuccessJobs: number;
  numberOfScheduleJobs: number;
  numberOfPendingJobs: number;
  createdAt: number;
  isFavorite: boolean;
}

/**
 * Search API response
 * Matches PageResponseDTO from backend
 */
export interface SearchResponse {
  content: SearchResult[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Search state management
 */
export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  showDropdown: boolean;
  selectedIndex: number;
  totalResults: number;
}

/**
 * Search component props
 */
export interface SearchBarProps {
  onNavigate?: (actionHash: string) => void;
  debounceMs?: number;
  minSearchLength?: number;
  maxResults?: number;
}

/**
 * Dropdown result item props
 */
export interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}
