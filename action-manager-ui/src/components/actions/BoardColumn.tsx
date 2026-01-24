import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import { Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ActionAPI, ActionOverview } from '../AppConstants';
import { RestClient } from '../GenericConstants';

import ActionCard from './ActionCard';
import EmptyState from './EmptyState';

export type ActionStatus = 'INITIAL' | 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export interface BoardColumnProps {
  status: ActionStatus;
  onActionClick: (actionHash: string) => void;
  restClient: RestClient;
  refreshTrigger?: number;
  onStatusChange?: () => void;
}

const statusConfig = {
  INITIAL: { icon: FiberManualRecordIcon, color: '#6b7280', bg: '#f3f4f6' },
  ACTIVE: { icon: CheckCircleIcon, color: '#10b981', bg: '#d1fae5' },
  PAUSED: { icon: PauseCircleIcon, color: '#f59e0b', bg: '#fef3c7' },
  DELETED: { icon: DeleteIcon, color: '#ef4444', bg: '#fee2e2' },
  ARCHIVED: { icon: ArchiveIcon, color: '#9ca3af', bg: '#e5e7eb' },
};

const PAGE_SIZE = 3;

export default function BoardColumn({
  status,
  onActionClick,
  restClient,
  refreshTrigger,
  onStatusChange,
}: BoardColumnProps) {
  const navigate = useNavigate();
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const [actions, setActions] = useState<ActionOverview[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await ActionAPI.loadActionSummarysAsync(
        0,
        PAGE_SIZE,
        '-createdAt',
        restClient,
        (result) => {
          setActions(result.content);
          setTotalElements(result.totalElements);
          setPageIndex(0);
        },
        status
      );
    } finally {
      setLoading(false);
    }
  }, [status, restClient]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleLoadMore = async () => {
    setLoading(true);
    const nextPage = pageIndex + 1;
    try {
      await ActionAPI.loadActionSummarysAsync(
        nextPage,
        PAGE_SIZE,
        '-createdAt',
        restClient,
        (result) => {
          setActions((prev) => [...prev, ...result.content]);
          setPageIndex(nextPage);
        },
        status
      );
    } finally {
      setLoading(false);
    }
  };

  const hasMore = actions.length < totalElements;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: config.bg,
            mr: 1,
          }}
        >
          <StatusIcon sx={{ fontSize: 18, color: config.color }} />
        </Box>
        <Typography
          variant="subtitle2"
          sx={{ textTransform: 'uppercase', fontWeight: 600, flex: 1 }}
        >
          {status}
        </Typography>
        <Chip label={actions.length} size="small" />
      </Box>

      {/* Cards Container */}
      <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
        {loading && actions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : actions.length === 0 ? (
          <EmptyState showAddButton={false} />
        ) : (
          <>
            {actions.map((action) => (
              <ActionCard
                key={action.hash}
                action={action}
                onClick={() => onActionClick(action.hash)}
                restClient={restClient}
                onRefresh={loadData}
                onStatusChange={onStatusChange}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  size="small"
                  startIcon={loading ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outlined"
                  fullWidth
                >
                  {loading ? 'Loading...' : `Load More (${totalElements - actions.length} more)`}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Add Action Button */}
      {status !== 'PAUSED' && status !== 'DELETED' && status !== 'ARCHIVED' && (
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate(`/actions/new?status=${status}`)}
          sx={{
            mt: 2,
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'text.secondary',
              bgcolor: 'action.hover',
            },
          }}
          fullWidth
          variant="outlined"
        >
          Add Action
        </Button>
      )}
    </Paper>
  );
}
