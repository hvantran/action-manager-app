import React, { forwardRef } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  Divider,
} from '@mui/material';
import { SearchResult } from './types';
import SearchResultItem from './SearchResultItem';

interface SearchDropdownProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  selectedIndex: number;
  totalResults: number;
  query: string;
  onResultClick: (actionHash: string) => void;
}

/**
 * SearchDropdown component
 * Displays search results in a dropdown below the search bar
 */
const SearchDropdown = forwardRef<HTMLDivElement, SearchDropdownProps>(
  ({ results, loading, error, selectedIndex, totalResults, query, onResultClick }, ref) => {
    return (
      <Paper
        ref={ref}
        elevation={8}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 1,
          maxHeight: 400,
          overflowY: 'auto',
          zIndex: 1300,
        }}
      >
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ p: 2 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {/* No Results */}
        {!loading && !error && results.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No actions found matching "{query}"
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try a different search term or create a new action
            </Typography>
          </Box>
        )}

        {/* Results List */}
        {!loading && !error && results.length > 0 && (
          <List dense>
            {results.map((result, index) => (
              <SearchResultItem
                key={result.hash}
                result={result}
                isSelected={index === selectedIndex}
                onClick={() => onResultClick(result.hash)}
              />
            ))}
            {totalResults > results.length && (
              <>
                <Divider />
                <ListItem>
                  <ListItemText
                    secondary={`Showing ${results.length} of ${totalResults} results`}
                  />
                </ListItem>
              </>
            )}
          </List>
        )}
      </Paper>
    );
  }
);

SearchDropdown.displayName = 'SearchDropdown';

export default SearchDropdown;
