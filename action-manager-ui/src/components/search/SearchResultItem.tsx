import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { SearchResultItemProps } from './types';

/**
 * SearchResultItem component
 * Displays a single search result
 */
const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isSelected,
  onClick,
}) => {
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
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

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isSelected}
        onClick={onClick}
        sx={{
          '&.Mui-selected': {
            backgroundColor: 'action.selected',
          },
        }}
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {result.isFavorite && <StarIcon fontSize="small" color="primary" />}
              <Typography variant="body2" fontWeight={500}>
                {result.name}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={result.actionStatus}
                size="small"
                color={getStatusColor(result.actionStatus)}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" color="text.secondary">
                {result.numberOfJobs} jobs
              </Typography>
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default SearchResultItem;
