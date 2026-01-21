# Technical Design: Action Manager Kanban Board UI

## Document Information
- **Created**: 2026-01-21
- **Feature**: Action Manager UI Redesign - Stitch Design Implementation
- **Version**: 1.0
- **Status**: Design Phase
- **References**: [requirements.md](./requirements.md)

## Executive Summary

This document defines the technical architecture and implementation strategy for transforming the Action Manager from a table-based UI to a Kanban board layout. The design leverages existing Material-UI components while introducing custom styled components to match the Stitch design system aesthetic.

## Architecture Overview

### Component Hierarchy

```
App
├── ResponsiveAppBar (existing, minor updates)
│   ├── ViewModeToggle (new)
│   └── SearchBar (existing)
├── ActionSummary (refactored)
│   ├── BoardView (new) ← Default View
│   │   ├── BoardColumn (new) × 4
│   │   │   ├── ColumnHeader (new)
│   │   │   ├── ActionCard (new) × N
│   │   │   │   ├── PriorityBadge (new)
│   │   │   │   ├── CardMetrics (new)
│   │   │   │   └── ProgressBar (existing MUI)
│   │   │   └── AddActionButton (new)
│   │   └── EmptyState (new)
│   └── ListView (existing, wrapped) ← Legacy View
│       └── PageEntityRender (existing table)
└── ProcessTracking (existing)
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Action Summary Component                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  State Management                                      │  │
│  │  - viewMode: 'board' | 'list'                         │  │
│  │  - actions: ActionOverview[]                          │  │
│  │  - searchFilter: string                               │  │
│  │  - processTracking: boolean                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓ ↑                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Data Transform Layer                                  │  │
│  │  - groupActionsByStatus()                             │  │
│  │  - filterActionsBySearch()                            │  │
│  │  - calculateMetrics()                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌────────────────┬────────────────┐                        │
│  │  BoardView     │  ListView      │                        │
│  │  (Kanban)      │  (Table)       │                        │
│  └────────────────┴────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                     REST API Layer                           │
│  ActionAPI.loadActionSummarysAsync()                        │
│  → GET /action-manager-backend/v1/actions                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. ViewModeToggle Component

**Purpose**: Allow users to switch between Board and List views

**Props Interface**:
```typescript
interface ViewModeToggleProps {
  currentMode: 'board' | 'list';
  onModeChange: (mode: 'board' | 'list') => void;
}
```

**Implementation Details**:
- Use MUI ToggleButtonGroup component
- Icons: `ViewModuleIcon` (board), `ViewListIcon` (list)
- Store preference in localStorage with key: `action-manager-view-mode`
- Default to 'board' view

**Styling**:
- Compact size, positioned in AppBar next to search
- Theme-aware colors (light/dark mode support)

### 2. BoardView Component

**Purpose**: Main container for Kanban board layout

**Props Interface**:
```typescript
interface BoardViewProps {
  actions: ActionOverview[];
  searchFilter: string;
  onActionClick: (actionHash: string) => void;
  onRefresh: () => void;
  restClient: RestClient;
}
```

**State Management**:
```typescript
const [groupedActions, setGroupedActions] = useState<GroupedActions>({
  INITIAL: [],
  ACTIVE: [],
  PAUSED: [],
  DELETED: []
});
```

**Implementation Details**:
- Grid layout with 4 columns using MUI Grid (xs=12, sm=6, md=3)
- Horizontal scrolling on overflow
- Auto-refresh every 30 seconds using `useEffect` with interval
- Filter actions based on searchFilter prop

**Styling**:
```typescript
const boardContainerStyle = {
  display: 'flex',
  gap: 2,
  p: 3,
  overflowX: 'auto',
  minHeight: 'calc(100vh - 200px)',
  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1a2332' : '#f5f7fa'
};
```

### 3. BoardColumn Component

**Purpose**: Represent a single status column in the Kanban board

**Props Interface**:
```typescript
interface BoardColumnProps {
  status: 'INITIAL' | 'ACTIVE' | 'PAUSED' | 'DELETED';
  actions: ActionOverview[];
  onActionClick: (actionHash: string) => void;
  onAddAction: (status: string) => void;
  restClient: RestClient;
}
```

**Implementation Details**:
- Fixed width: 300px on desktop, full width on mobile
- Scrollable content area with max-height
- Load More functionality when actions > 20
- Empty state when no actions

**Status Colors**:
```typescript
const statusColors = {
  INITIAL: { icon: 'circle', color: '#6b7280', bg: '#f3f4f6' },
  ACTIVE: { icon: 'check_circle', color: '#10b981', bg: '#d1fae5' },
  PAUSED: { icon: 'pause_circle', color: '#f59e0b', bg: '#fef3c7' },
  DELETED: { icon: 'delete', color: '#ef4444', bg: '#fee2e2' }
};
```

**Column Header**:
```typescript
<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
  <StatusIcon color={statusColors[status].color} />
  <Typography variant="h6" sx={{ ml: 1, textTransform: 'uppercase' }}>
    {status}
  </Typography>
  <Chip label={actions.length} size="small" sx={{ ml: 'auto' }} />
</Box>
```

### 4. ActionCard Component

**Purpose**: Display individual action as a card

**Props Interface**:
```typescript
interface ActionCardProps {
  action: ActionOverview;
  onClick: () => void;
  onFavoriteToggle: (hash: string, isFavorite: boolean) => void;
}
```

**Card Structure**:
```tsx
<Card
  sx={{
    mb: 2,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      boxShadow: 4,
      transform: 'translateY(-2px)'
    }
  }}
  onClick={onClick}
>
  <CardContent>
    {/* Priority Badge */}
    <PriorityBadge priority={calculatePriority(action)} />
    
    {/* Action Title */}
    <Typography variant="h6" sx={{ mt: 1, mb: 0.5 }}>
      {truncateText(action.name, 50)}
    </Typography>
    
    {/* Description */}
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {truncateText(action.description || 'No description', 100)}
    </Typography>
    
    {/* Metrics */}
    <CardMetrics
      successCount={action.numberOfSuccessJobs}
      failureCount={action.numberOfFailureJobs}
      pendingCount={action.numberOfPendingJobs}
    />
    
    {/* Progress Bar */}
    <LinearProgress
      variant="determinate"
      value={calculateProgress(action)}
      sx={{ mt: 2, height: 6, borderRadius: 3 }}
    />
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
      {calculateProgress(action)}% Complete
    </Typography>
  </CardContent>
</Card>
```

### 5. PriorityBadge Component

**Purpose**: Display priority indicator

**Props Interface**:
```typescript
interface PriorityBadgeProps {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

**Priority Calculation Logic**:
```typescript
function calculatePriority(action: ActionOverview): 'HIGH' | 'MEDIUM' | 'LOW' {
  const failureRate = action.numberOfFailureJobs / (action.numberOfJobs || 1);
  const pendingRate = action.numberOfPendingJobs / (action.numberOfJobs || 1);
  
  if (failureRate > 0.3 || action.numberOfFailureJobs > 10) return 'HIGH';
  if (pendingRate > 0.5 || action.numberOfPendingJobs > 5) return 'MEDIUM';
  return 'LOW';
}
```

**Styling**:
```typescript
const priorityStyles = {
  HIGH: { bgcolor: '#fee2e2', color: '#991b1b', label: 'HIGH' },
  MEDIUM: { bgcolor: '#fef3c7', color: '#92400e', label: 'MEDIUM' },
  LOW: { bgcolor: '#f3f4f6', color: '#374151', label: 'LOW' }
};

<Chip
  label={priorityStyles[priority].label}
  size="small"
  sx={{
    ...priorityStyles[priority],
    fontWeight: 600,
    fontSize: '0.75rem'
  }}
/>
```

### 6. CardMetrics Component

**Purpose**: Display job statistics

**Props Interface**:
```typescript
interface CardMetricsProps {
  successCount: number;
  failureCount: number;
  pendingCount: number;
}
```

**Implementation**:
```tsx
<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
    <Typography variant="body2">{successCount}</Typography>
  </Box>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <WarningIcon sx={{ fontSize: 18, color: '#ef4444' }} />
    <Typography variant="body2">{failureCount}</Typography>
  </Box>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <ScheduleIcon sx={{ fontSize: 18, color: '#6b7280' }} />
    <Typography variant="body2">{pendingCount}</Typography>
  </Box>
</Box>
```

## State Management Strategy

### Local Storage Keys
```typescript
const STORAGE_KEYS = {
  VIEW_MODE: 'action-manager-view-mode',
  THEME: 'action-manager-enable-dark-theme',
  PAGE_INDEX: 'action-manager-action-table-page-index',
  PAGE_SIZE: 'action-manager-action-table-page-size',
  ORDER_BY: 'action-manager-action-table-order'
};
```

### Component State
```typescript
// ActionSummary.tsx state
const [viewMode, setViewMode] = useState<'board' | 'list'>(
  LocalStorageService.getOrDefault(STORAGE_KEYS.VIEW_MODE, 'board')
);
const [actions, setActions] = useState<ActionOverview[]>([]);
const [searchFilter, setSearchFilter] = useState('');
const [processTracking, setProcessTracking] = useState(false);
```

### Data Transformation Functions

```typescript
// Group actions by status
function groupActionsByStatus(actions: ActionOverview[]): GroupedActions {
  return actions.reduce((acc, action) => {
    const status = action.status || 'INITIAL';
    if (!acc[status]) acc[status] = [];
    acc[status].push(action);
    return acc;
  }, {} as GroupedActions);
}

// Filter actions by search term
function filterActions(actions: ActionOverview[], searchTerm: string): ActionOverview[] {
  if (!searchTerm) return actions;
  const lowerSearch = searchTerm.toLowerCase();
  return actions.filter(action =>
    action.name.toLowerCase().includes(lowerSearch) ||
    (action.description || '').toLowerCase().includes(lowerSearch)
  );
}

// Calculate progress percentage
function calculateProgress(action: ActionOverview): number {
  const total = action.numberOfJobs || 0;
  if (total === 0) return 0;
  const completed = action.numberOfSuccessJobs + action.numberOfFailureJobs;
  return Math.round((completed / total) * 100);
}
```

## Theme Configuration

### Extend Existing Themes

```typescript
// Update GenericConstants.tsx

export const BOARD_THEME_EXTENSION = {
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600
        }
      }
    }
  }
};

export const DARK_THEME = createTheme({
  ...existingDarkTheme,
  palette: {
    ...existingDarkTheme.palette,
    background: {
      default: '#0f1419',
      paper: '#1a2332'
    }
  },
  ...BOARD_THEME_EXTENSION
});

export const DEFAULT_THEME = createTheme({
  ...existingDefaultTheme,
  palette: {
    ...existingDefaultTheme.palette,
    background: {
      default: '#f5f7fa',
      paper: '#ffffff'
    }
  },
  ...BOARD_THEME_EXTENSION
});
```

## API Integration

### No Backend Changes Required

The existing API endpoints will be used as-is:
- `GET /action-manager-backend/v1/actions` - Fetch all actions with pagination
- `POST /action-manager-backend/v1/actions/{hash}/favorite` - Toggle favorite status
- `POST /action-manager-backend/v1/actions/{hash}/archive` - Archive action

### Response Format (Existing)
```typescript
interface PagingResult {
  totalElements: number;
  content: ActionOverview[];
}

interface ActionOverview {
  hash: string;
  name: string;
  description?: string;
  status: 'INITIAL' | 'ACTIVE' | 'PAUSED' | 'DELETED';
  createdAt: number;
  numberOfJobs: number;
  numberOfPendingJobs: number;
  numberOfFailureJobs: number;
  numberOfSuccessJobs: number;
  numberOfScheduleJobs: number;
  isFavorite: boolean;
}
```

## File Structure

### New Files to Create

```
src/
├── components/
│   ├── actions/
│   │   ├── ActionSummary.tsx (refactor existing)
│   │   ├── BoardView.tsx (new)
│   │   ├── BoardColumn.tsx (new)
│   │   ├── ActionCard.tsx (new)
│   │   ├── PriorityBadge.tsx (new)
│   │   ├── CardMetrics.tsx (new)
│   │   └── EmptyState.tsx (new)
│   └── common/
│       └── ViewModeToggle.tsx (new)
└── ResponsiveAppBar.tsx (minor updates)
```

### Refactoring ActionSummary.tsx

**Before**: Single component with table rendering
**After**: Smart component that conditionally renders BoardView or ListView

```typescript
export default function ActionSummary() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [actions, setActions] = useState<ActionOverview[]>([]);
  
  // ... existing state and logic ...
  
  return (
    <Stack spacing={2}>
      {viewMode === 'board' ? (
        <BoardView
          actions={actions}
          searchFilter={searchFilter}
          onActionClick={(hash) => navigate(`/actions/${hash}`)}
          onRefresh={loadActions}
          restClient={restClient}
        />
      ) : (
        <PageEntityRender {...pageEntityMetadata} />
      )}
      <ProcessTracking isLoading={processTracking} />
      <ConfirmationDialog {...confirmationDeleteDialogMeta} />
    </Stack>
  );
}
```

## Responsive Design Strategy

### Breakpoint Configuration

```typescript
const breakpoints = {
  mobile: '@media (max-width: 768px)',
  tablet: '@media (min-width: 769px) and (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)'
};
```

### Responsive Column Layout

```typescript
<Grid container spacing={2}>
  {Object.entries(groupedActions).map(([status, statusActions]) => (
    <Grid item xs={12} sm={6} md={3} key={status}>
      <BoardColumn
        status={status}
        actions={statusActions}
        onActionClick={onActionClick}
        onAddAction={onAddAction}
        restClient={restClient}
      />
    </Grid>
  ))}
</Grid>
```

### Mobile Optimizations

```typescript
const cardStyleMobile = {
  [breakpoints.mobile]: {
    '& .MuiCardContent-root': {
      padding: '12px'
    },
    '& .MuiTypography-h6': {
      fontSize: '1rem'
    },
    '& .MuiTypography-body2': {
      fontSize: '0.8rem'
    }
  }
};
```

## Performance Optimizations

### 1. Memoization Strategy

```typescript
// Memoize expensive calculations
const groupedActions = useMemo(
  () => groupActionsByStatus(filteredActions),
  [filteredActions]
);

const filteredActions = useMemo(
  () => filterActions(actions, searchFilter),
  [actions, searchFilter]
);

// Memoize card components
const ActionCard = React.memo(ActionCardComponent, (prev, next) => {
  return prev.action.hash === next.action.hash &&
         prev.action.numberOfJobs === next.action.numberOfJobs;
});
```

### 2. Virtual Scrolling (Future Enhancement)

```typescript
import { FixedSizeList } from 'react-window';

// When column has > 50 actions
<FixedSizeList
  height={600}
  itemCount={actions.length}
  itemSize={150}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ActionCard action={actions[index]} onClick={onActionClick} />
    </div>
  )}
</FixedSizeList>
```

### 3. Debounced Search

```typescript
import { debounce } from '@mui/material/utils';

const debouncedSearch = useMemo(
  () => debounce((searchTerm: string) => {
    setSearchFilter(searchTerm);
  }, 300),
  []
);

<SearchBar onChange={(e) => debouncedSearch(e.target.value)} />
```

## Testing Strategy

### Unit Tests

```typescript
// BoardView.test.tsx
describe('BoardView', () => {
  it('should render 4 status columns', () => {
    render(<BoardView actions={mockActions} {...props} />);
    expect(screen.getAllByRole('region')).toHaveLength(4);
  });

  it('should group actions by status correctly', () => {
    const grouped = groupActionsByStatus(mockActions);
    expect(grouped.ACTIVE).toHaveLength(2);
    expect(grouped.INITIAL).toHaveLength(3);
  });
});

// ActionCard.test.tsx
describe('ActionCard', () => {
  it('should calculate priority based on failure rate', () => {
    const action = { ...mockAction, numberOfFailureJobs: 15, numberOfJobs: 20 };
    render(<ActionCard action={action} onClick={jest.fn()} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('should navigate to detail page on click', () => {
    const onClick = jest.fn();
    render(<ActionCard action={mockAction} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(mockAction.hash);
  });
});
```

### Integration Tests

```typescript
// ActionSummary.integration.test.tsx
describe('ActionSummary Integration', () => {
  it('should switch between board and list views', async () => {
    render(<ActionSummary />);
    
    // Initially shows board view
    expect(screen.getByTestId('board-view')).toBeInTheDocument();
    
    // Click list view toggle
    fireEvent.click(screen.getByLabelText('List view'));
    
    // Should show table view
    expect(screen.getByTestId('table-view')).toBeInTheDocument();
  });

  it('should filter actions by search term', async () => {
    render(<ActionSummary />);
    
    const searchInput = screen.getByPlaceholderText('Search actions...');
    fireEvent.change(searchInput, { target: { value: 'test-action' } });
    
    await waitFor(() => {
      expect(screen.getAllByTestId('action-card')).toHaveLength(1);
    });
  });
});
```

### Visual Regression Tests (Recommended)

```typescript
// Use Storybook + Chromatic or Percy
export default {
  title: 'Components/BoardView',
  component: BoardView
};

export const Default = () => (
  <BoardView actions={mockActions} {...props} />
);

export const DarkMode = () => (
  <ThemeProvider theme={DARK_THEME}>
    <BoardView actions={mockActions} {...props} />
  </ThemeProvider>
);

export const EmptyState = () => (
  <BoardView actions={[]} {...props} />
);
```

## Error Handling Strategy

### Error Boundaries

```typescript
// BoardErrorBoundary.tsx
class BoardErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Board View Error:', error, errorInfo);
    // Log to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
async function loadActions() {
  try {
    setProcessTracking(true);
    const result = await ActionAPI.loadActionSummarysAsync(...);
    setActions(result.content);
  } catch (error) {
    toast.error('Failed to load actions. Retrying...');
    // Retry logic with exponential backoff
    setTimeout(() => loadActions(), 2000);
  } finally {
    setProcessTracking(false);
  }
}
```

## Migration Strategy

### Phase 1: Foundation (Days 1-2)
1. Create new component files with basic structure
2. Extend theme configuration
3. Implement ViewModeToggle
4. Add view mode state to ActionSummary

### Phase 2: Core Components (Days 3-5)
1. Implement BoardView with column layout
2. Create BoardColumn component
3. Develop ActionCard with all sub-components
4. Integrate with existing API

### Phase 3: Features & Polish (Days 6-8)
1. Add search filtering to board view
2. Implement metrics calculation
3. Add hover effects and animations
4. Responsive design testing

### Phase 4: Testing & Documentation (Days 9-10)
1. Write unit tests for all new components
2. Perform integration testing
3. Accessibility audit and fixes
4. Update documentation

## Rollback Plan

### Feature Flag Strategy

```typescript
// env.sh or environment variable
REACT_APP_ENABLE_BOARD_VIEW=true

// In ActionSummary.tsx
const boardViewEnabled = process.env.REACT_APP_ENABLE_BOARD_VIEW === 'true';

if (!boardViewEnabled) {
  // Force list view
  return <PageEntityRender {...pageEntityMetadata} />;
}
```

### Gradual Rollout
1. Enable for internal users first (week 1)
2. Monitor for issues and gather feedback
3. Enable for 50% of users (week 2)
4. Full rollout if no critical issues (week 3)

## Success Metrics

### Technical Metrics
- Page load time: < 2 seconds
- Time to interactive: < 3 seconds
- First contentful paint: < 1 second
- Layout shift score: < 0.1

### User Experience Metrics
- View mode toggle usage: Track adoption rate
- Average time spent in board vs list view
- Action click-through rate
- Search usage frequency

### Quality Metrics
- Zero critical bugs in production
- Test coverage ≥ 80%
- Accessibility score ≥ 95 (Lighthouse)
- Code review approval rate: 100%

## Open Questions & Decisions Needed

1. **Q**: Should we implement drag-and-drop in Phase 1 or defer to Phase 2?
   - **Decision**: Defer to future enhancement (noted in requirements)

2. **Q**: What should be the default view mode for new users?
   - **Decision**: Board view (Kanban) to showcase new feature

3. **Q**: Should we add action priority as a stored field or calculate dynamically?
   - **Decision**: Calculate dynamically based on job metrics

4. **Q**: Maximum actions to load initially per column?
   - **Decision**: 20 actions per column, with "Load More" for additional

5. **Q**: Auto-refresh interval for board view?
   - **Decision**: 30 seconds (configurable via environment variable)

---

**Status**: Ready for implementation
**Next Step**: Create `tasks.md` with detailed implementation checklist
