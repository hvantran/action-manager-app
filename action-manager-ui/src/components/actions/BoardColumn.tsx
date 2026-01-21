import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionOverview } from '../AppConstants';
import ActionCard from './ActionCard';
import EmptyState from './EmptyState';

export type ActionStatus = 'INITIAL' | 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export interface BoardColumnProps {
  status: ActionStatus;
  actions: ActionOverview[];
  onActionClick: (actionHash: string) => void;
}

const statusConfig = {
  INITIAL: { icon: FiberManualRecordIcon, color: '#6b7280', bg: '#f3f4f6' },
  ACTIVE: { icon: CheckCircleIcon, color: '#10b981', bg: '#d1fae5' },
  PAUSED: { icon: PauseCircleIcon, color: '#f59e0b', bg: '#fef3c7' },
  DELETED: { icon: DeleteIcon, color: '#ef4444', bg: '#fee2e2' },
  ARCHIVED: { icon: ArchiveIcon, color: '#9ca3af', bg: '#e5e7eb' }
};

export default function BoardColumn({ status, actions, onActionClick }: BoardColumnProps) {
  const navigate = useNavigate();
  const config = statusConfig[status];
  const StatusIcon = config.icon;

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
        flexDirection: 'column'
      }}
    >
      {/* Column Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: config.bg,
            mr: 1
          }}
        >
          <StatusIcon sx={{ fontSize: 18, color: config.color }} />
        </Box>
        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', fontWeight: 600, flex: 1 }}>
          {status}
        </Typography>
        <Chip label={actions.length} size="small" />
      </Box>

      {/* Cards Container */}
      <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
        {actions.length === 0 ? (
          <EmptyState />
        ) : (
          actions.map((action) => (
            <ActionCard
              key={action.hash}
              action={action}
              onClick={() => onActionClick(action.hash)}
            />
          ))
        )}
      </Box>

      {/* Add Action Button */}
      {status !== 'DELETED' && status !== 'ARCHIVED' && (
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/actions/new')}
          sx={{ mt: 2 }}
          fullWidth
          variant="text"
        >
          Add Action
        </Button>
      )}
    </Paper>
  );
}
