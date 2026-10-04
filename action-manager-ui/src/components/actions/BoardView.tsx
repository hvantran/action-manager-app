import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RestClient } from '../GenericConstants';
import BoardColumn, { ActionStatus } from './BoardColumn';

export interface BoardViewProps {
  restClient: RestClient;
  refreshTrigger?: number;
  onStatusChange?: () => void;
}

export default function BoardView({ restClient, refreshTrigger, onStatusChange }: BoardViewProps) {
  const navigate = useNavigate();
  const statusOrder: ActionStatus[] = ['INITIAL', 'ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'];

  const handleActionClick = (actionHash: string) => {
    navigate(`/actions/${actionHash}`);
  };

  return (
    <div className="w-full pb-6 pt-2 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusOrder.map((status) => (
          <div key={status} className="w-full min-w-0">
            <BoardColumn
              status={status}
              onActionClick={handleActionClick}
              restClient={restClient}
              refreshTrigger={refreshTrigger}
              onStatusChange={onStatusChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
