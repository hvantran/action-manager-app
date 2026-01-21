import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Tooltip, Typography } from '@mui/material';
import React from 'react';

export interface CardMetricsProps {
  successCount: number;
  failureCount: number;
  pendingCount: number;
}

export default function CardMetrics({
  successCount,
  failureCount,
  pendingCount,
}: CardMetricsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <Tooltip title="Success jobs">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {successCount}
          </Typography>
        </Box>
      </Tooltip>

      <Tooltip title="Failed jobs">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WarningAmberIcon sx={{ fontSize: 18, color: '#ef4444' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {failureCount}
          </Typography>
        </Box>
      </Tooltip>

      <Tooltip title="Pending jobs">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ScheduleIcon sx={{ fontSize: 18, color: '#6b7280' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {pendingCount}
          </Typography>
        </Box>
      </Tooltip>
    </Box>
  );
}
