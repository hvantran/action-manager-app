import { Box, Grid } from '@mui/material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionOverview } from '../AppConstants';
import BoardColumn, { ActionStatus } from './BoardColumn';

export interface BoardViewProps {
  actions: ActionOverview[];
}

type GroupedActions = Record<ActionStatus, ActionOverview[]>;

function groupActionsByStatus(actions: ActionOverview[]): GroupedActions {
  const grouped: GroupedActions = {
    INITIAL: [],
    ACTIVE: [],
    PAUSED: [],
    DELETED: [],
    ARCHIVED: []
  };

  actions.forEach((action) => {
    const status = (action.status?.toUpperCase() || 'INITIAL') as ActionStatus;
    if (grouped[status]) {
      grouped[status].push(action);
    }
  });

  return grouped;
}

export default function BoardView({ actions }: BoardViewProps) {
  const navigate = useNavigate();

  const groupedActions = useMemo(() => groupActionsByStatus(actions), [actions]);

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
              actions={groupedActions[status]}
              onActionClick={handleActionClick}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
