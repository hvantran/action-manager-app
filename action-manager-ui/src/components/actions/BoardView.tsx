import { Box } from '@mui/material';
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
    <Box
      className="min-h-[calc(100vh-200px)] overflow-x-auto px-4 pb-6 pt-4 md:px-6"
      sx={{
        p: 3,
        overflowX: 'auto',
        minHeight: 'calc(100vh - 200px)',
      }}
    >
      <Box
        className="flex min-w-max gap-4"
        sx={{
          display: 'flex',
          gap: 2,
          minWidth: 'fit-content',
        }}
      >
        {statusOrder.map((status) => (
          <Box
            key={status}
            className="w-full min-w-[280px] md:min-w-[240px]"
            sx={{
              flex: '0 0 auto',
              width: {
                xs: '100%',
                sm: 'calc(50% - 8px)',
                md: 'calc(20% - 12.8px)',
              },
              minWidth: {
                xs: '280px',
                md: '240px',
              },
            }}
          >
            <BoardColumn
              status={status}
              onActionClick={handleActionClick}
              restClient={restClient}
              refreshTrigger={refreshTrigger}
              onStatusChange={onStatusChange}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
