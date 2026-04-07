import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import * as React from 'react';

import { SpeedDialActionMetadata } from '../GenericConstants';

export default function FloatingSpeedDialButtons(props: any) {
  const actions: Array<SpeedDialActionMetadata> = props.actions;
  return (
    <SpeedDial
      ariaLabel="SpeedDial actions"
      className="[&_.MuiFab-primary]:bg-amber-500 [&_.MuiFab-primary]:text-slate-950 [&_.MuiFab-primary]:shadow-xl [&_.MuiFab-primary:hover]:bg-amber-400"
      sx={{ position: 'fixed', bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
      // direction='left'
    >
      {actions.map((action: SpeedDialActionMetadata) => (
        <SpeedDialAction
          key={action.actionName}
          icon={action.actionIcon}
          FabProps={{
            ...action.properties,
            className: [
              'bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50',
              action.properties?.className,
            ]
              .filter(Boolean)
              .join(' '),
          }}
          tooltipTitle={action.actionLabel}
          onClick={action.onClick}
        />
      ))}
    </SpeedDial>
  );
}
