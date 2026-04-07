import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InboxIcon from '@mui/icons-material/Inbox';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface EmptyStateProps {
  message?: string;
  showAddButton?: boolean;
}

export default function EmptyState({
  message = 'No actions in this column',
  showAddButton = true,
}: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <Box
      className="flex flex-col items-center justify-center px-3 py-10 text-center"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        textAlign: 'center',
      }}
    >
      <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {showAddButton && (
        <Button
          className="rounded-xl border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          size="small"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/actions/new')}
          variant="outlined"
        >
          Add Action
        </Button>
      )}
    </Box>
  );
}
