import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PauseIcon from '@mui/icons-material/Pause';
import RestoreIcon from '@mui/icons-material/Restore';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Link,
  Typography,
} from '@mui/material';
import React from 'react';

import { ActionAPI, ActionOverview } from '../AppConstants';
import { RestClient } from '../GenericConstants';

export interface ActionCardProps {
  action: ActionOverview;
  onClick: () => void;
  restClient: RestClient;
  onRefresh?: () => void;
  onStatusChange?: () => void;
}

type HealthStatus = 'Critical' | 'Warning' | 'Healthy';

// Utility functions
function getHealthStatus(action: ActionOverview): HealthStatus {
  const failureRate = action.numberOfFailureJobs / (action.numberOfJobs || 1);

  if (failureRate > 0.3 || action.numberOfFailureJobs > 0) return 'Critical';
  if (action.numberOfPendingJobs > action.numberOfJobs * 0.5) return 'Warning';
  return 'Healthy';
}

function calculateSuccessRate(action: ActionOverview): number {
  const total = action.numberOfJobs || 0;
  if (total === 0) return 0;
  return Math.round((action.numberOfSuccessJobs / total) * 100);
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
}

const ActionCard = React.memo(function ActionCard({
  action,
  onClick,
  restClient,
  onRefresh,
  onStatusChange,
}: ActionCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(action.isFavorite || false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const healthStatus = getHealthStatus(action);
  const successRate = calculateSuccessRate(action);
  const total = action.numberOfJobs || 0;
  const scheduledCount = action.numberOfScheduleJobs || 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    ActionAPI.setFavoriteAction(action.hash, newFavoriteState, restClient, () => {
      setIsFavorite(newFavoriteState);
      // Trigger refresh after successful favorite toggle
      if (onRefresh) {
        onRefresh();
      }
    });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.export(action.hash, action.name, restClient);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.archive(action.hash, restClient, () => {
      // Trigger refresh of all columns when status changes
      if (onStatusChange) {
        onStatusChange();
      } else if (onRefresh) {
        onRefresh();
      }
    });
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.restoreAction(action.hash, restClient, () => {
      // Trigger refresh of all columns when status changes
      if (onStatusChange) {
        onStatusChange();
      } else if (onRefresh) {
        onRefresh();
      }
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    // Use soft delete - move to DELETED status
    ActionAPI.softDeleteAction(action.hash, restClient, () => {
      // Trigger refresh of all columns when status changes
      if (onStatusChange) {
        onStatusChange();
      } else if (onRefresh) {
        onRefresh();
      }
    });
  };

  const handlePermanentDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handlePermanentDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    ActionAPI.permanentDeleteAction(action.hash, restClient, () => {
      // Trigger refresh after successful permanent delete
      if (onRefresh) {
        onRefresh();
      }
    });
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.pauseAction(action.hash, restClient, () => {
      // Trigger refresh of all columns when status changes
      if (onStatusChange) {
        onStatusChange();
      } else if (onRefresh) {
        onRefresh();
      }
    });
  };

  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case 'Critical':
        return '#dc2626';
      case 'Warning':
        return '#ea580c';
      case 'Healthy':
        return '#10b981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'PAUSED':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'INITIAL':
        return { bg: '#e0e7ff', text: '#3730a3' };
      default:
        return { bg: '#f3f4f6', text: '#1f2937' };
    }
  };

  const statusColors = getStatusColor(action.status);

  return (
    <>
      <Card
        className="mb-2 rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        sx={{
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: '1px solid #e5e7eb',
        '&:hover': {
          boxShadow: 3,
          borderColor: '#d1d5db',
        },
      }}
      onClick={onClick}
    >
      <CardContent className="p-4" sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header: Title with Star and Menu */}
        <Box
          className="mb-1 flex items-start justify-between gap-2"
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              flex: 1,
              mr: 1,
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {action.name}
          </Typography>
          <Box className="flex gap-1" sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleFavoriteClick}
              className="rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
              sx={{ p: 0.5 }}
            >
              {isFavorite ? (
                <StarIcon sx={{ fontSize: 20, color: '#eab308' }} />
              ) : (
                <StarBorderIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleMenuClick}
              className="rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
              sx={{ p: 0.5 }}
            >
              <MoreHorizIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Status and Date */}
        <Box className="mb-2 flex flex-wrap items-center gap-2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip
            label={action.status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24,
            }}
            className="rounded-full"
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            • {formatDate(action.createdAt)}
          </Typography>
        </Box>

        {/* Metrics Grid: Total Jobs and Health */}
        <Box className="mb-2 grid grid-cols-2 gap-3" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', mb: 0.5 }}
            >
              TOTAL JOBS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem' }}>
              {total}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', mb: 0.5 }}
            >
              HEALTH
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: getHealthColor(healthStatus),
                }}
              />
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: getHealthColor(healthStatus), fontSize: '0.875rem' }}
              >
                {healthStatus}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Status Breakdown */}
        <Box className="mb-2" sx={{ mb: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Status Breakdown
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              {successRate}% Success
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={successRate}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#fecaca',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#10b981',
                borderRadius: 4,
              },
            }}
          />
          {/* Legend */}
          <Box className="mt-1 flex flex-wrap gap-3" sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f97316' }} />
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {scheduledCount}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626' }} />
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {action.numberOfFailureJobs}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {action.numberOfSuccessJobs}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {action.numberOfPendingJobs}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer: View Details and Actions */}
        <Box
          className="flex items-center justify-between border-t border-slate-100 pt-2"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1,
            borderTop: '1px solid #f3f4f6',
          }}
        >
          <Link
            href="#"
            underline="hover"
            className="text-xs font-bold uppercase tracking-[0.16em]"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onClick={(e) => {
              e.preventDefault();
              onClick();
            }}
          >
            View Details
          </Link>
          <Box className="flex gap-1" sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleExport}
              className="rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
              sx={{ p: 0.5 }}
              title="Export"
            >
              <FileDownloadIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {action.status === 'ACTIVE' && (
              <IconButton
                size="small"
                onClick={handlePause}
                className="rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                sx={{ p: 0.5 }}
                title="Pause"
              >
                <PauseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {action.status === 'ARCHIVED' && (
              <IconButton
                size="small"
                onClick={handleRestore}
                className="rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                sx={{ p: 0.5 }}
                title="Restore"
              >
                <RestoreIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {action.status === 'DELETED' && (
              <IconButton
                size="small"
                onClick={handleRestore}
                className="rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                sx={{ p: 0.5 }}
                title="Restore from Trash"
              >
                <RestoreIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {action.status !== 'DELETED' && action.status !== 'ARCHIVED' && (
              <IconButton
                size="small"
                onClick={handleArchive}
                className="rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                sx={{ p: 0.5 }}
                title="Archive"
              >
                <ArchiveOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {action.status === 'DELETED' ? (
              <IconButton 
                size="small" 
                onClick={handlePermanentDelete} 
                className="rounded-full border border-red-200 bg-red-50 p-1"
                sx={{ p: 0.5, color: '#dc2626', '&:hover': { color: '#b91c1c' } }} 
                title="Delete Forever"
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            ) : action.status !== 'ARCHIVED' && (
              <IconButton 
                size="small" 
                onClick={handleDelete} 
                className="rounded-full border border-red-200 bg-red-50 p-1"
                sx={{ p: 0.5, color: '#dc2626', '&:hover': { color: '#b91c1c' } }} 
                title="Move to Trash"
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    <Dialog
      open={deleteDialogOpen}
      onClose={handleDeleteCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      PaperProps={{
        className: 'rounded-3xl border border-slate-200 bg-white shadow-2xl',
      }}
    >
      <DialogTitle id="delete-dialog-title" className="px-6 pt-6 text-xl font-semibold text-slate-900">
        {action.status === 'DELETED' ? 'Permanently Delete Action' : 'Move to Trash'}
      </DialogTitle>
      <DialogContent className="px-6 pb-2">
        <DialogContentText id="delete-dialog-description" className="text-sm leading-6 text-slate-600">
          {action.status === 'DELETED' ? (
            <>
              Are you sure you want to <strong>permanently delete</strong> action "<strong>{action.name}</strong>"?
              <br /><br />
              <strong style={{ color: '#dc2626' }}>Warning: This action cannot be undone. All associated jobs and results will be permanently removed.</strong>
            </>
          ) : (
            <>
              Are you sure you want to move action "<strong>{action.name}</strong>" to trash? 
              You can restore it later from the DELETED column.
            </>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions className="px-6 pb-6 pt-2">
        <Button onClick={handleDeleteCancel} color="primary" className="rounded-full px-5 py-2 text-xs font-semibold tracking-[0.16em] text-slate-600">
          Cancel
        </Button>
        <Button 
          onClick={action.status === 'DELETED' ? handlePermanentDeleteConfirm : handleDeleteConfirm} 
          color="error" 
          variant="contained" 
          className="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold tracking-[0.16em] text-white hover:bg-red-700"
          autoFocus
        >
          {action.status === 'DELETED' ? 'Delete Forever' : 'Move to Trash'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
});

export default ActionCard;
