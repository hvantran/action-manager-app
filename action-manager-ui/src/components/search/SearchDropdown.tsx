import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import StarIcon from '@mui/icons-material/Star';
import { SearchResult } from './SearchBar';

/**
 * SearchDropdown component props
 */
interface SearchDropdownProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  selectedIndex: number;
  totalResults: number;
  query: string;
  onResultClick: (actionHash: string) => void;
  onMouseEnter?: (index: number) => void;
}

/**
 * SearchResultItem component
 */
interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
}

/**
 * Get status color based on action status
 */
const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'FAILED':
      return 'error';
    default:
      return 'default';
  }
};

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isSelected,
  onClick,
  onMouseEnter,
}) => {
  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isSelected}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        sx={{
          py: { xs: 1.5, md: 1 }, // More padding on mobile for touch targets
          '&.Mui-selected': {
            backgroundColor: 'action.selected',
          },
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body1" 
                fontWeight={500}
                sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
              >
                {result.name}
              </Typography>
              {result.isFavorite && (
                <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              )}
              <Chip
                label={result.status}
                size="small"
                color={getStatusColor(result.status)}
                sx={{ ml: 'auto' }}
              />
            </Box>
          }
          secondary={
            <>
              {result.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                  }}
                >
                  {result.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Typography variant="caption" color="text.disabled">
                  Jobs: {result.numberOfJobs}
                </Typography>
                {result.numberOfFailedJobs > 0 && (
                  <Typography variant="caption" color="error">
                    Failed: {result.numberOfFailedJobs}
                  </Typography>
                )}
              </Box>
            </>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

/**
 * SearchDropdown component
 */
const SearchDropdown = React.forwardRef<HTMLDivElement, SearchDropdownProps>(
  (
    { results, loading, error, selectedIndex, totalResults, query, onResultClick, onMouseEnter },
    ref
  ) => {
    /**
     * Render loading state
     */
    if (loading) {
      return (
        <Paper
          ref={ref}
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: { xs: 300, md: 400 },
            overflow: 'auto',
            zIndex: 1300,
            maxWidth: { xs: '100vw', md: 'none' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        </Paper>
      );
    }

    /**
     * Render error state
     */
    if (error) {
      return (
        <Paper
          ref={ref}
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: { xs: 300, md: 400 },
            overflow: 'auto',
            zIndex: 1300,
            maxWidth: { xs: '100vw', md: 'none' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              px: 2,
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        </Paper>
      );
    }

    /**
     * Render empty state
     */
    if (results.length === 0) {
      return (
        <Paper
          ref={ref}
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: { xs: 300, md: 400 },
            overflow: 'auto',
            zIndex: 1300,
            maxWidth: { xs: '100vw', md: 'none' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              px: 2,
            }}
          >
            <SearchOffIcon sx={{ fontSize: 48, mb: 2, color: 'text.disabled' }} />
            <Typography color="text.secondary" align="center">
              No actions found for "{query}"
            </Typography>
          </Box>
        </Paper>
      );
    }

    /**
     * Render results
     */
    return (
      <Paper
        ref={ref}
        elevation={4}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 1,
          maxHeight: { xs: 300, md: 400 },
          overflow: 'auto',
          zIndex: 1300,
          maxWidth: { xs: '100vw', md: 'none' },
        }}
      >
        <List disablePadding>
          {results.map((result, index) => (
            <SearchResultItem
              key={result.hash}
              result={result}
              isSelected={index === selectedIndex}
              onClick={() => onResultClick(result.hash)}
              onMouseEnter={() => onMouseEnter?.(index)}
            />
          ))}
        </List>

        {totalResults > results.length && (
          <>
            <Divider />
            <Box sx={{ py: 1, px: 2, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                Showing {results.length} of {totalResults} results
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    );
  }
);

SearchDropdown.displayName = 'SearchDropdown';

export default SearchDropdown;
