import { Card, CardContent, LinearProgress, Typography } from '@mui/material';
import React from 'react';
import { ActionOverview } from '../AppConstants';
import CardMetrics from './CardMetrics';
import PriorityBadge, { Priority } from './PriorityBadge';

export interface ActionCardProps {
  action: ActionOverview;
  onClick: () => void;
}

// Utility functions
function calculatePriority(action: ActionOverview): Priority {
  const failureRate = action.numberOfFailureJobs / (action.numberOfJobs || 1);
  const pendingRate = action.numberOfPendingJobs / (action.numberOfJobs || 1);
  
  if (failureRate > 0.3 || action.numberOfFailureJobs > 10) return 'HIGH';
  if (pendingRate > 0.5 || action.numberOfPendingJobs > 5) return 'MEDIUM';
  return 'LOW';
}

function calculateProgress(action: ActionOverview): number {
  const total = action.numberOfJobs || 0;
  if (total === 0) return 0;
  const completed = action.numberOfSuccessJobs + action.numberOfFailureJobs;
  return Math.round((completed / total) * 100);
}

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

const ActionCard = React.memo(function ActionCard({ action, onClick }: ActionCardProps) {
  const priority = calculatePriority(action);
  const progress = calculateProgress(action);

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)'
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        {/* Priority Badge */}
        <PriorityBadge priority={priority} />
        
        {/* Action Title */}
        <Typography variant="h6" sx={{ mt: 1, mb: 0.5, fontSize: '1rem' }}>
          {truncateText(action.name, 50)}
        </Typography>
        
        {/* Metrics */}
        <CardMetrics
          successCount={action.numberOfSuccessJobs}
          failureCount={action.numberOfFailureJobs}
          pendingCount={action.numberOfPendingJobs}
        />
        
        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mt: 2, height: 6, borderRadius: 3 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {progress}% Complete
        </Typography>
      </CardContent>
    </Card>
  );
});

export default ActionCard;
