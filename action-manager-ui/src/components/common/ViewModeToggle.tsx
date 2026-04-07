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
      className="rounded-full border border-slate-200 bg-white p-1 shadow-sm"
      sx={{
        '& .MuiToggleButton-root': {
          border: 0,
          borderRadius: 9999,
          color: '#64748b',
          paddingInline: '0.9rem',
        },
        '& .Mui-selected': {
          backgroundColor: '#0f172a',
          color: '#f8fafc',
        },
        '& .Mui-selected:hover': {
          backgroundColor: '#1e293b',
        },
      }}
    >
      <ToggleButton value="board" aria-label="board view" className="transition-colors">
        <ViewModuleIcon />
      </ToggleButton>
      <ToggleButton value="list" aria-label="list view" className="transition-colors">
        <ViewListIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
