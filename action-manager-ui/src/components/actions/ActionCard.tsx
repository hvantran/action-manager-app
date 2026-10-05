import React, { useState } from 'react';
import { ConfirmationDialog } from '@hvantran/ui-component-library';
import {
  Star,
  Download,
  Pause,
  RotateCcw,
  Archive,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
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

const statusColorsMap: Record<string, { bg: string; text: string }> = {
  INITIAL: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  ACTIVE: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
  PAUSED: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
  DELETED: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300' },
  ARCHIVED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
};

const healthColorsMap: Record<HealthStatus, { dot: string; text: string }> = {
  Healthy: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  Warning: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  Critical: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

const ActionCard = React.memo(function ActionCard({
  action,
  onClick,
  restClient,
  onRefresh,
  onStatusChange,
}: ActionCardProps) {
  const [isFavorite, setIsFavorite] = useState(action.isFavorite || false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const healthStatus = getHealthStatus(action);
  const successRate = calculateSuccessRate(action);
  const total = action.numberOfJobs || 0;
  const scheduledCount = action.numberOfScheduleJobs || 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    ActionAPI.setFavoriteAction(action.hash, newFavoriteState, restClient, () => {
      setIsFavorite(newFavoriteState);
      if (onRefresh) onRefresh();
    });
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.export(action.hash, action.name, restClient);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.archive(action.hash, restClient, () => {
      if (onStatusChange) onStatusChange();
      else if (onRefresh) onRefresh();
    });
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.restoreAction(action.hash, restClient, () => {
      if (onStatusChange) onStatusChange();
      else if (onRefresh) onRefresh();
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    ActionAPI.pauseAction(action.hash, restClient, () => {
      if (onStatusChange) onStatusChange();
      else if (onRefresh) onRefresh();
    });
  };

  const handleDeleteConfirm = () => {
    ActionAPI.softDeleteAction(action.hash, restClient, () => {
      setDeleteDialogOpen(false);
      if (onStatusChange) onStatusChange();
      else if (onRefresh) onRefresh();
    });
  };

  const handlePermanentDeleteConfirm = () => {
    ActionAPI.permanentDeleteAction(action.hash, restClient, () => {
      setDeleteDialogOpen(false);
      if (onStatusChange) onStatusChange();
      else if (onRefresh) onRefresh();
    });
  };

  const statusStyle = statusColorsMap[action.status] || statusColorsMap.INITIAL;
  const healthStyle = healthColorsMap[healthStatus];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className="w-full text-left bg-surface-card-light dark:bg-surface-card-dark rounded-xl border border-secondary-200 dark:border-secondary-800 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer mb-3 font-sans"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-secondary-900 dark:text-white break-words flex-1">
            {action.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={handleFavoriteClick}
              className="p-1 rounded-full text-secondary-400 hover:text-amber-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-amber-400 text-amber-400' : 'text-secondary-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status & Date */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusStyle.bg} ${statusStyle.text}`}
          >
            {action.status}
          </span>
          <span className="text-xs text-secondary-400">&bull; {formatDate(action.createdAt)}</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-secondary-50/60 dark:bg-secondary-800/40 p-2.5 rounded-lg">
          <div>
            <span className="text-[10px] uppercase font-semibold text-secondary-400 block mb-0.5">
              Total Jobs
            </span>
            <span className="text-xl font-bold text-secondary-900 dark:text-white">{total}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-secondary-400 block mb-0.5">
              Health
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${healthStyle.dot}`} />
              <span className={`text-xs font-semibold ${healthStyle.text}`}>{healthStatus}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center text-[11px] text-secondary-500 mb-1">
            <span>Success Rate</span>
            <span className="font-semibold text-secondary-700 dark:text-secondary-300">
              {successRate}%
            </span>
          </div>
          <div className="w-full bg-red-100 dark:bg-red-950/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${successRate}%` }}
            />
          </div>
          {/* Counters */}
          <div className="flex items-center gap-3 mt-1.5 text-[11px]">
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {scheduledCount}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {action.numberOfFailureJobs}
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {action.numberOfSuccessJobs}
            </span>
            <span className="flex items-center gap-1 text-purple-600">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              {action.numberOfPendingJobs}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-secondary-100 dark:border-secondary-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            View Details
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Export action"
              onClick={handleExport}
              className="p-1 text-secondary-500 hover:text-secondary-800 dark:hover:text-white rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {action.status === 'ACTIVE' && (
              <button
                type="button"
                title="Pause action"
                onClick={handlePause}
                className="p-1 text-secondary-500 hover:text-amber-600 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
            {(action.status === 'ARCHIVED' || action.status === 'DELETED') && (
              <button
                type="button"
                title="Restore action"
                onClick={handleRestore}
                className="p-1 text-secondary-500 hover:text-emerald-600 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {action.status !== 'DELETED' && action.status !== 'ARCHIVED' && (
              <button
                type="button"
                title="Archive action"
                onClick={handleArchive}
                className="p-1 text-secondary-500 hover:text-secondary-800 dark:hover:text-white rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              title={action.status === 'DELETED' ? 'Delete forever' : 'Move to trash'}
              onClick={handleDelete}
              className="p-1 text-secondary-500 hover:text-error-600 rounded hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title={action.status === 'DELETED' ? 'Permanently Delete Action' : 'Move to Trash'}
        content={
          action.status === 'DELETED' ? (
            <p>
              Are you sure you want to permanently delete action <b>{action.name}</b>? All
              associated jobs and results will be permanently removed.
            </p>
          ) : (
            <p>
              Are you sure you want to move action <b>{action.name}</b> to trash? You can restore it
              later from the DELETED column.
            </p>
          )
        }
        positiveText={action.status === 'DELETED' ? 'Delete Forever' : 'Move to Trash'}
        negativeText="Cancel"
        negativeAction={() => setDeleteDialogOpen(false)}
        positiveAction={
          action.status === 'DELETED' ? handlePermanentDeleteConfirm : handleDeleteConfirm
        }
      />
    </>
  );
});

export default ActionCard;
