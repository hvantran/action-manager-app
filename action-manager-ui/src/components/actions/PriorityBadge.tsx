import { Chip } from '@mui/material';
import React from 'react';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles = {
  HIGH: { bgcolor: '#fecaca', color: '#dc2626', label: 'HIGH' },
  MEDIUM: { bgcolor: '#fed7aa', color: '#ea580c', label: 'MEDIUM' },
  LOW: { bgcolor: '#d1d5db', color: '#6b7280', label: 'LOW' },
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
        height: 20,
      }}
    />
  );
}
