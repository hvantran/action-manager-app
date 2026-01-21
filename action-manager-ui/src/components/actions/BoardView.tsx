import { Box, Grid } from '@mui/material';
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
      <Grid container spacing={2}>
        {statusOrder.map((status) => (
          <Grid item xs={12} sm={6} md={2.4} key={status}>
            <BoardColumn
              status={status}
              onActionClick={handleActionClick}
              restClient={restClient}
              refreshTrigger={refreshTrigger}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
