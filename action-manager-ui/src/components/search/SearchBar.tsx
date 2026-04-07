import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, InputAdornment, CircularProgress, Box, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SearchDropdown from './SearchDropdown';
import { ActionAPI } from '../AppConstants';
import { RestClient } from '../GenericConstants';

/**
 * Search result interface matching ActionOverviewDTO
 */
export interface SearchResult {
  hash: string;
  name: string;
  description?: string;
  isFavorite: boolean;
  createdAt: number;
  numberOfJobs: number;
  numberOfScheduledJobs: number;
  numberOfFailedJobs: number;
  status: string;
}

/**
 * SearchBar component props
 */
interface SearchBarProps {
  placeholder?: string;
  minSearchLength?: number;
  maxResults?: number;
  debounceMs?: number;
  onNavigate?: (actionHash: string) => void;
  restClient: RestClient;
}

/**
 * SearchBar state
 */
interface SearchBarState {
  query: string;
  debouncedQuery: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  showDropdown: boolean;
  selectedIndex: number;
  totalResults: number;
}

/**
 * SearchBar component with debounced search and keyboard navigation
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search actions...',
  minSearchLength = 2,
  maxResults = 10,
  debounceMs = 300,
  onNavigate,
  restClient,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<SearchBarState>({
    query: '',
    debouncedQuery: '',
    results: [],
    loading: false,
    error: null,
    showDropdown: false,
    selectedIndex: -1,
    totalResults: 0,
  });

  /**
   * Debounce search query
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, debouncedQuery: prev.query }));
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [state.query, debounceMs]);

  /**
   * Perform search when debounced query changes
   */
  useEffect(() => {
    const performSearch = async () => {
      // Reset if query too short
      if (state.debouncedQuery.length < minSearchLength) {
        setState((prev) => ({
          ...prev,
          results: [],
          loading: false,
          error: null,
          totalResults: 0,
          showDropdown: false,
        }));
        return;
      }

      // Set loading state
      setState((prev) => ({ ...prev, loading: true, error: null, showDropdown: true }));

      try {
        await ActionAPI.searchActions(
          state.debouncedQuery,
          0,
          maxResults,
          restClient,
          (searchResult) => {
            setState((prev) => ({
              ...prev,
              results: searchResult.content || [],
              totalResults: searchResult.totalElements || 0,
              loading: false,
              error: null,
              showDropdown: true,
            }));
          }
        );
      } catch (error: any) {
        console.error('Search error:', error);
        setState((prev) => ({
          ...prev,
          results: [],
          totalResults: 0,
          loading: false,
          error: error.message || 'Search failed. Please try again.',
          showDropdown: true,
        }));
      }
    };

    performSearch();
  }, [state.debouncedQuery, minSearchLength, maxResults, restClient]);

  /**
   * Handle input change
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setState((prev) => ({
      ...prev,
      query: newQuery,
      selectedIndex: -1,
    }));
  };

  /**
   * Handle result selection
   */
  const handleResultClick = (actionHash: string) => {
    if (onNavigate) {
      onNavigate(actionHash);
    } else {
      navigate(`/actions/${actionHash}`);
    }
    handleClear();
  };

  /**
   * Handle clear button
   */
  const handleClear = () => {
    setState({
      query: '',
      debouncedQuery: '',
      results: [],
      loading: false,
      error: null,
      showDropdown: false,
      selectedIndex: -1,
      totalResults: 0,
    });
    inputRef.current?.focus();
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!state.showDropdown || state.results.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1),
        }));
        break;

      case 'ArrowUp':
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1),
        }));
        break;

      case 'Enter':
        event.preventDefault();
        if (state.selectedIndex >= 0 && state.results[state.selectedIndex]) {
          handleResultClick(state.results[state.selectedIndex].hash);
        }
        break;

      case 'Escape':
        event.preventDefault();
        handleClear();
        break;

      default:
        break;
    }
  };

  /**
   * Handle mouse enter on dropdown item
   */
  const handleMouseEnter = (index: number) => {
    setState((prev) => ({ ...prev, selectedIndex: index }));
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setState((prev) => ({ ...prev, showDropdown: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: { xs: '100%', md: 600 } // Full width on mobile, 600px on desktop
    }}>
      <TextField
        ref={inputRef}
        fullWidth
        size="small"
        placeholder={placeholder}
        value={state.query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {state.loading ? (
                <CircularProgress size={20} />
              ) : state.query ? (
                <IconButton size="small" onClick={handleClear} aria-label="clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            fontSize: { xs: '0.875rem', md: '1rem' }, // Smaller font on mobile
          },
        }}
      />

      {state.showDropdown && (
        <SearchDropdown
          ref={dropdownRef}
          results={state.results}
          loading={state.loading}
          error={state.error}
          selectedIndex={state.selectedIndex}
          totalResults={state.totalResults}
          query={state.query}
          onResultClick={handleResultClick}
          onMouseEnter={handleMouseEnter}
        />
      )}
    </Box>
  );
};

export default SearchBar;
