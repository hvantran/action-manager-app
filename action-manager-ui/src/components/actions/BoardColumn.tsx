import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Circle,
  CheckCircle,
  PauseCircle,
  Trash2,
  Archive,
  ChevronDown,
  PlusCircle,
} from 'lucide-react';
import { Spinner } from '@hvantran/ui-component-library';
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

const statusConfig: Record<
  ActionStatus,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  INITIAL: { icon: Circle, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  ACTIVE: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  PAUSED: { icon: PauseCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  DELETED: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' },
  ARCHIVED: { icon: Archive, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
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
    <div className="flex flex-col min-h-[500px] rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-surface-ground-light dark:bg-surface-ground-dark p-3 shadow-sm font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-secondary-200 dark:border-secondary-800">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${config.bg}`}>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary-800 dark:text-secondary-200">
            {status}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400">
          {actions.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
        {loading && actions.length === 0 ? (
          <div className="flex justify-center p-6">
            <Spinner size="md" />
          </div>
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

            {hasMore && (
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Load More ({totalElements - actions.length} more)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Action Button */}
      {status !== 'PAUSED' && status !== 'DELETED' && status !== 'ARCHIVED' && (
        <button
          type="button"
          onClick={() => navigate(`/actions/new?status=${status}`)}
          className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-secondary-300 dark:border-secondary-700 text-xs font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:border-secondary-400 dark:hover:border-secondary-600 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Action</span>
        </button>
      )}
    </div>
  );
}
