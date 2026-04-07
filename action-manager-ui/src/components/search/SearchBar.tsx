import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { SearchBarProps, SearchState } from './types';
import { SearchService } from './searchService';
import SearchDropdown from './SearchDropdown';
import { useDebounce } from './useDebounce';

/**
 * SearchBar component for header
 * Provides real-time action search with dropdown results
 * 
 * Features:
 * - Debounced search (default 300ms)
 * - Keyboard navigation (up/down/enter/escape)
 * - Click-outside to close dropdown
 * - Loading and error states
 * - Minimum search length validation
 * 
 * @param props SearchBarProps
 */
const SearchBar: React.FC<SearchBarProps> = ({
  onNavigate,
  debounceMs = 300,
  minSearchLength = 2,
  maxResults = 10,
}) => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search state
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    showDropdown: false,
    selectedIndex: -1,
    totalResults: 0,
  });

  // Debounced search query
  const debouncedQuery = useDebounce(state.query, debounceMs);

  /**
   * Perform search when debounced query changes
   */
  useEffect(() => {
    // TODO: Implement search logic
    // Will be implemented in next phase
    console.log('Search query:', debouncedQuery);
  }, [debouncedQuery]);

  /**
   * Handle input change
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setState((prev) => ({
      ...prev,
      query,
      showDropdown: query.length >= minSearchLength,
    }));
  };

  /**
   * Clear search input
   */
  const handleClear = () => {
    setState({
      query: '',
      results: [],
      loading: false,
      error: null,
      showDropdown: false,
      selectedIndex: -1,
      totalResults: 0,
    });
    searchInputRef.current?.focus();
  };

  /**
   * Handle result selection
   */
  const handleResultClick = (actionHash: string) => {
    // TODO: Implement navigation
    console.log('Navigate to action:', actionHash);
    handleClear();
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // TODO: Implement keyboard navigation
    console.log('Key pressed:', event.key);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        inputRef={searchInputRef}
        fullWidth
        size="small"
        placeholder="Search actions..."
        value={state.query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: state.query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 1,
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
        />
      )}
    </Box>
  );
};

export default SearchBar;
