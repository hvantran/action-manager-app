import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import React from 'react';

export interface ViewModeToggleProps {
  currentMode: 'board' | 'list';
  onModeChange: (mode: 'board' | 'list') => void;
}

export default function ViewModeToggle({ currentMode, onModeChange }: ViewModeToggleProps) {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'board' | 'list' | null
  ) => {
    if (newMode !== null) {
      onModeChange(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentMode}
      exclusive
      onChange={handleChange}
      aria-label="view mode"
      size="small"
    >
      <ToggleButton value="board" aria-label="board view">
        <ViewModuleIcon />
      </ToggleButton>
      <ToggleButton value="list" aria-label="list view">
        <ViewListIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
