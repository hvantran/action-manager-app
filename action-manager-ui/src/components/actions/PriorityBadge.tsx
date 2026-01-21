import { Chip } from '@mui/material';
import React from 'react';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles = {
  HIGH: { bgcolor: '#fee2e2', color: '#991b1b', label: 'HIGH' },
  MEDIUM: { bgcolor: '#fef3c7', color: '#92400e', label: 'MEDIUM' },
  LOW: { bgcolor: '#f3f4f6', color: '#374151', label: 'LOW' }
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = priorityStyles[priority];
  
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{
        bgcolor: style.bgcolor,
        color: style.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 20
      }}
    />
  );
}
