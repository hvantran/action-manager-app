import { Box } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RestClient } from '../GenericConstants';
import BoardColumn, { ActionStatus } from './BoardColumn';

export interface BoardViewProps {
  restClient: RestClient;
  refreshTrigger?: number;
}

export default function BoardView({ restClient, refreshTrigger }: BoardViewProps) {
  const navigate = useNavigate();

  const statusOrder: ActionStatus[] = ['INITIAL', 'ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'];

  const handleActionClick = (actionHash: string) => {
    navigate(`/actions/${actionHash}`);
  };

  return (
    <Box
      sx={{
        p: 3,
        overflowX: 'auto',
        minHeight: 'calc(100vh - 200px)'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          minWidth: 'fit-content'
        }}
      >
        {statusOrder.map((status) => (
          <Box
            key={status}
            sx={{
              flex: '0 0 auto',
              width: {
                xs: '100%',
                sm: 'calc(50% - 8px)',
                md: 'calc(20% - 12.8px)'
              },
              minWidth: {
                xs: '280px',
                md: '240px'
              }
            }}
          >
            <BoardColumn
              status={status}
              onActionClick={handleActionClick}
              restClient={restClient}
              refreshTrigger={refreshTrigger}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
