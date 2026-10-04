import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, PlusCircle } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center font-sans">
      <Inbox className="w-10 h-10 text-secondary-300 dark:text-secondary-600 mb-2" />
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">{message}</p>
      {showAddButton && (
        <button
          type="button"
          onClick={() => navigate('/actions/new')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary-700 dark:text-secondary-200 border border-secondary-300 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Action</span>
        </button>
      )}
    </div>
  );
}
