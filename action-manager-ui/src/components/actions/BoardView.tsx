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
    <div className="w-full overflow-x-auto pb-6 pt-2 font-sans">
      <div className="flex gap-4 min-w-max">
        {statusOrder.map((status) => (
          <div key={status} className="w-72 shrink-0">
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
