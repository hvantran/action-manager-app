# Implementation Tasks: Action Manager Kanban Board UI

## Document Information
- **Created**: 2026-01-21
- **Feature**: Action Manager UI Redesign - Stitch Design Implementation
- **Version**: 1.0
- **Status**: Implementation Ready
- **References**: [requirements.md](./requirements.md), [design.md](./design.md)

## Task Progress Tracking

**Legend**: ☐ Not Started | ⏳ In Progress | ✅ Complete | ❌ Blocked

---

## Phase 1: Foundation & Setup (Est: 2-3 hours)

### Task 1.1: Create Component File Structure
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: None

**Checklist**:
- [ ] Create `src/components/actions/BoardView.tsx`
- [ ] Create `src/components/actions/BoardColumn.tsx`
- [ ] Create `src/components/actions/ActionCard.tsx`
- [ ] Create `src/components/actions/PriorityBadge.tsx`
- [ ] Create `src/components/actions/CardMetrics.tsx`
- [ ] Create `src/components/actions/EmptyState.tsx`
- [ ] Create `src/components/common/ViewModeToggle.tsx`

**Acceptance Criteria**:
- All files created with TypeScript scaffolding
- Proper imports for React and Material-UI
- Export statements in place

---

### Task 1.2: Extend Theme Configuration
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 45 minutes  
**Dependencies**: None

**Implementation**:
Update `src/components/GenericConstants.tsx`:

**Checklist**:
- [ ] Add `BOARD_THEME_EXTENSION` object with MUI overrides
- [ ] Update `DARK_THEME` with new background colors and component overrides
- [ ] Update `DEFAULT_THEME` with new background colors and component overrides
- [ ] Add storage key constants for view mode
- [ ] Add utility functions for priority calculation
- [ ] Add utility functions for progress calculation

**Acceptance Criteria**:
- Theme compiles without errors
- Card hover effects work in both themes
- Background colors match Stitch design specs

---

### Task 1.3: Implement ViewModeToggle Component
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.1

**Implementation Location**: `src/components/common/ViewModeToggle.tsx`

**Checklist**:
- [ ] Create TypeScript interface for props
- [ ] Implement component with ToggleButtonGroup
- [ ] Add ViewModuleIcon and ViewListIcon
- [ ] Implement localStorage persistence
- [ ] Add ARIA labels for accessibility
- [ ] Style for light/dark theme compatibility

**Acceptance Criteria**:
- Toggle switches between 'board' and 'list' modes
- Preference persists in localStorage
- Keyboard navigation works
- Theme-aware styling applied

**Test Cases**:
```typescript
- Should render with initial mode
- Should call onModeChange when toggled
- Should persist selection to localStorage
- Should be keyboard accessible
```

---

### Task 1.4: Update ResponsiveAppBar
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 1.3

**Implementation Location**: `src/ResponsiveAppBar.tsx`

**Checklist**:
- [ ] Import ViewModeToggle component
- [ ] Add viewMode state prop
- [ ] Add setViewMode callback prop
- [ ] Position ViewModeToggle next to search bar
- [ ] Ensure responsive behavior on mobile

**Acceptance Criteria**:
- ViewModeToggle appears in AppBar
- Toggle is responsive on all screen sizes
- No layout shifts when toggling

---

## Phase 2: Core Board Components (Est: 4-5 hours)

### Task 2.1: Implement EmptyState Component
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 1.1

**Implementation Location**: `src/components/actions/EmptyState.tsx`

**Checklist**:
- [ ] Create component with message prop
- [ ] Add illustration or icon
- [ ] Add "Add Action" CTA button
- [ ] Style for centered layout
- [ ] Add dark theme support

**Acceptance Criteria**:
- Displays when no actions in column
- CTA button navigates to action creation
- Visually centered and appealing

---

### Task 2.2: Implement PriorityBadge Component
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 1.1, Task 1.2

**Implementation Location**: `src/components/actions/PriorityBadge.tsx`

**Checklist**:
- [ ] Create TypeScript interface for props
- [ ] Implement priority color mapping
- [ ] Use MUI Chip component
- [ ] Add proper styling for each priority level
- [ ] Ensure color contrast meets accessibility standards

**Acceptance Criteria**:
- HIGH priority shows red badge
- MEDIUM priority shows orange/yellow badge
- LOW priority shows gray badge
- Color contrast ratio >= 4.5:1

**Test Cases**:
```typescript
- Should render HIGH priority with red color
- Should render MEDIUM priority with yellow color
- Should render LOW priority with gray color
```

---

### Task 2.3: Implement CardMetrics Component
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.1

**Implementation Location**: `src/components/actions/CardMetrics.tsx`

**Checklist**:
- [ ] Create TypeScript interface for props
- [ ] Implement icon + count layout
- [ ] Use CheckCircleIcon for success
- [ ] Use WarningIcon for failures
- [ ] Use ScheduleIcon for pending
- [ ] Style horizontal alignment
- [ ] Add tooltips for metric explanations

**Acceptance Criteria**:
- All three metrics display correctly
- Icons align horizontally
- Counts are readable
- Tooltips show on hover

**Test Cases**:
```typescript
- Should display success count with green icon
- Should display failure count with red icon  
- Should display pending count with gray icon
- Should handle zero counts
```

---

### Task 2.4: Implement ActionCard Component
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.2, Task 2.3

**Implementation Location**: `src/components/actions/ActionCard.tsx`

**Checklist**:
- [ ] Create TypeScript interface for props
- [ ] Implement card layout with MUI Card
- [ ] Integrate PriorityBadge
- [ ] Add truncated title and description
- [ ] Integrate CardMetrics
- [ ] Add LinearProgress bar
- [ ] Implement hover effect (elevation + transform)
- [ ] Add onClick handler for navigation
- [ ] Memoize component for performance

**Acceptance Criteria**:
- Card displays all action information
- Title truncates at 50 characters
- Description truncates at 100 characters
- Progress bar shows accurate percentage
- Hover effect is smooth
- Click navigates to action detail page

**Test Cases**:
```typescript
- Should render action title and description
- Should calculate and display progress correctly
- Should truncate long titles with ellipsis
- Should call onClick with action hash
- Should show priority badge
- Should display all metrics
```

---

### Task 2.5: Implement BoardColumn Component
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 1.5 hours  
**Dependencies**: Task 2.1, Task 2.4

**Implementation Location**: `src/components/actions/BoardColumn.tsx`

**Checklist**:
- [ ] Create TypeScript interface for props
- [ ] Implement column header with status icon
- [ ] Add action count chip
- [ ] Create scrollable content area
- [ ] Map actions to ActionCard components
- [ ] Implement EmptyState for zero actions
- [ ] Add "Add Action" button at bottom
- [ ] Style with proper width (300px desktop)
- [ ] Implement responsive width

**Acceptance Criteria**:
- Column header shows status and count
- Actions display as cards
- Empty state shows when no actions
- Column is scrollable when content overflows
- Responsive on mobile (full width)

**Test Cases**:
```typescript
- Should render column header with status
- Should render all action cards
- Should show empty state when no actions
- Should be scrollable with many actions
- Should display action count in header
```

---

### Task 2.6: Implement BoardView Component
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.5

**Implementation Location**: `src/components/actions/BoardView.tsx`

**Checklist**:
- [ ] Create TypeScript interface for props
- [ ] Implement groupActionsByStatus utility
- [ ] Implement filterActions utility
- [ ] Create responsive Grid layout
- [ ] Render BoardColumn for each status
- [ ] Implement search filtering
- [ ] Add auto-refresh every 30 seconds
- [ ] Memoize grouped and filtered actions
- [ ] Add breadcrumb navigation
- [ ] Style board container with proper background

**Acceptance Criteria**:
- Four columns render (INITIAL, ACTIVE, PAUSED, DELETED)
- Actions grouped correctly by status
- Search filtering works across all columns
- Grid is responsive on all screen sizes
- Auto-refresh fetches new data

**Test Cases**:
```typescript
- Should group actions by status correctly
- Should render 4 BoardColumn components
- Should filter actions by search term
- Should refresh data every 30 seconds
- Should handle empty action list
```

---

## Phase 3: Integration & Refactoring (Est: 2-3 hours)

### Task 3.1: Refactor ActionSummary Component
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 1.5 hours  
**Dependencies**: Task 2.6, Task 1.4

**Implementation Location**: `src/components/actions/ActionSummary.tsx`

**Checklist**:
- [ ] Add viewMode state with localStorage persistence
- [ ] Add searchFilter state
- [ ] Implement conditional rendering (BoardView vs PageEntityRender)
- [ ] Pass all required props to BoardView
- [ ] Ensure existing table view still works
- [ ] Update data fetching to support both views
- [ ] Handle loading states consistently

**Acceptance Criteria**:
- View mode toggles between board and list
- Both views use same data source
- Loading indicator works for both views
- No regression in list view functionality

**Test Cases**:
```typescript
- Should render BoardView when mode is 'board'
- Should render PageEntityRender when mode is 'list'
- Should persist view mode preference
- Should fetch data correctly for both views
```

---

### Task 3.2: Add Search Functionality to Board View
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 1 hour  
**Dependencies**: Task 3.1

**Checklist**:
- [ ] Connect search bar to BoardView
- [ ] Implement debounced search (300ms)
- [ ] Filter actions in real-time
- [ ] Show "No results" message when appropriate
- [ ] Ensure search works across all columns

**Acceptance Criteria**:
- Search filters actions instantly
- Search is debounced to avoid excessive renders
- Empty results show appropriate message
- Search works case-insensitively

**Test Cases**:
```typescript
- Should filter actions by name
- Should filter actions by description
- Should be case-insensitive
- Should debounce search input
- Should show no results message
```

---

### Task 3.3: Add Utility Functions to GenericConstants
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 1.2

**Implementation Location**: `src/components/GenericConstants.tsx`

**Checklist**:
- [ ] Add `calculatePriority()` function
- [ ] Add `calculateProgress()` function
- [ ] Add `groupActionsByStatus()` function
- [ ] Add `filterActions()` function
- [ ] Add `truncateText()` function
- [ ] Export all utility functions

**Acceptance Criteria**:
- Functions are properly typed
- Functions handle edge cases (null, undefined, zero values)
- Functions are exported and usable

**Test Cases**:
```typescript
- calculatePriority: Should return HIGH for failure rate > 0.3
- calculateProgress: Should return 0 for zero jobs
- groupActionsByStatus: Should group correctly
- filterActions: Should filter by name and description
- truncateText: Should add ellipsis at limit
```

---

## Phase 4: Responsive Design & Polish (Est: 2-3 hours)

### Task 4.1: Implement Responsive Breakpoints
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 1.5 hours  
**Dependencies**: Task 2.6

**Checklist**:
- [ ] Test board layout on mobile (< 768px)
- [ ] Test board layout on tablet (768px - 1024px)
- [ ] Test board layout on desktop (> 1024px)
- [ ] Adjust Grid breakpoints (xs=12, sm=6, md=3)
- [ ] Reduce card padding on mobile
- [ ] Adjust font sizes for mobile
- [ ] Test horizontal scrolling on mobile

**Acceptance Criteria**:
- Mobile: Columns stack vertically
- Tablet: 2 columns per row
- Desktop: 4 columns horizontally
- No layout shifts or overflow issues

**Test Scenarios**:
- Test on iPhone SE (375px width)
- Test on iPad (768px width)
- Test on desktop (1920px width)

---

### Task 4.2: Add Hover and Animation Effects
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 1 hour  
**Dependencies**: Task 2.4

**Checklist**:
- [ ] Add card elevation on hover
- [ ] Add translateY transform on hover
- [ ] Ensure transitions are smooth (200ms)
- [ ] Test performance with many cards
- [ ] Add focus states for keyboard navigation

**Acceptance Criteria**:
- Cards lift smoothly on hover
- No performance issues with animations
- Focus states are visible
- Animations work in both themes

---

### Task 4.3: Dark Mode Theme Testing
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 1.2, All Phase 2 tasks

**Checklist**:
- [ ] Test all components in dark mode
- [ ] Verify background colors match design
- [ ] Ensure text contrast is sufficient
- [ ] Check card shadows in dark mode
- [ ] Verify icon colors in dark mode
- [ ] Test theme toggle transitions

**Acceptance Criteria**:
- All text is readable in dark mode
- Color contrast meets WCAG AA standards
- Theme transitions are smooth
- No visual glitches

---

## Phase 5: Testing & Quality Assurance (Est: 3-4 hours)

### Task 5.1: Write Unit Tests
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: All Phase 2 and 3 tasks

**Test Files to Create**:
- `BoardView.test.tsx`
- `BoardColumn.test.tsx`
- `ActionCard.test.tsx`
- `PriorityBadge.test.tsx`
- `CardMetrics.test.tsx`
- `ViewModeToggle.test.tsx`

**Checklist**:
- [ ] Write tests for BoardView
- [ ] Write tests for BoardColumn
- [ ] Write tests for ActionCard
- [ ] Write tests for PriorityBadge
- [ ] Write tests for CardMetrics
- [ ] Write tests for ViewModeToggle
- [ ] Write tests for utility functions
- [ ] Achieve >= 80% code coverage

**Acceptance Criteria**:
- All tests pass
- Code coverage >= 80%
- No console errors or warnings

---

### Task 5.2: Integration Testing
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 1.5 hours  
**Dependencies**: Task 5.1

**Test File**: `ActionSummary.integration.test.tsx`

**Checklist**:
- [ ] Test view mode switching
- [ ] Test action filtering
- [ ] Test action navigation
- [ ] Test data loading
- [ ] Test error handling
- [ ] Test auto-refresh

**Acceptance Criteria**:
- All integration tests pass
- User flows work end-to-end
- Error states are handled gracefully

---

### Task 5.3: Accessibility Audit
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 1 hour  
**Dependencies**: Task 4.3

**Checklist**:
- [ ] Run Lighthouse accessibility audit
- [ ] Verify keyboard navigation works
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Ensure all interactive elements have ARIA labels
- [ ] Check color contrast ratios
- [ ] Verify focus indicators are visible
- [ ] Test tab order

**Acceptance Criteria**:
- Lighthouse accessibility score >= 95
- All interactive elements keyboard accessible
- Screen reader announces correctly
- WCAG 2.1 AA standards met

---

### Task 5.4: Performance Testing
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 5.2

**Checklist**:
- [ ] Run Lighthouse performance audit
- [ ] Test with 100+ actions
- [ ] Profile component renders
- [ ] Check for memory leaks
- [ ] Verify debounced search performance
- [ ] Test auto-refresh impact

**Acceptance Criteria**:
- Initial load < 2 seconds
- Time to interactive < 3 seconds
- No memory leaks detected
- Smooth scrolling with many items

---

## Phase 6: Documentation & Deployment (Est: 1-2 hours)

### Task 6.1: Update Component Documentation
**Status**: ☐  
**Priority**: Medium  
**Estimated Time**: 45 minutes  
**Dependencies**: All implementation tasks

**Checklist**:
- [ ] Add JSDoc comments to all components
- [ ] Document props interfaces
- [ ] Add usage examples
- [ ] Update README with new features
- [ ] Document breaking changes (if any)

**Acceptance Criteria**:
- All public APIs documented
- Examples are clear and runnable
- README is up to date

---

### Task 6.2: Create Migration Guide
**Status**: ☐  
**Priority**: Low  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 6.1

**Checklist**:
- [ ] Document view mode toggle usage
- [ ] Explain localStorage keys
- [ ] List any behavioral changes
- [ ] Provide troubleshooting tips

**Acceptance Criteria**:
- Guide is clear and comprehensive
- Common issues documented
- Migration path is obvious

---

### Task 6.3: Pre-Deployment Checklist
**Status**: ☐  
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: All previous tasks

**Checklist**:
- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Lighthouse scores meet targets
- [ ] Dark mode works correctly
- [ ] Responsive design verified
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] Documentation updated

**Acceptance Criteria**:
- Production build succeeds
- All quality gates passed
- Ready for deployment

---

## Risk Mitigation Tracker

### High Priority Risks

**Risk 1: Performance with Large Datasets**
- **Status**: Monitoring
- **Mitigation**: Implement virtual scrolling if >50 actions per column
- **Owner**: TBD

**Risk 2: Theme Consistency**
- **Status**: Addressed in Task 4.3
- **Mitigation**: Comprehensive dark mode testing
- **Owner**: TBD

### Medium Priority Risks

**Risk 3: Browser Compatibility**
- **Status**: Monitoring
- **Mitigation**: Test on Chrome, Firefox, Safari, Edge
- **Owner**: TBD

---

## Estimated Total Time

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Foundation | 2-3 hours |
| Phase 2: Core Components | 4-5 hours |
| Phase 3: Integration | 2-3 hours |
| Phase 4: Responsive Design | 2-3 hours |
| Phase 5: Testing & QA | 3-4 hours |
| Phase 6: Documentation | 1-2 hours |
| **Total** | **14-20 hours** |

---

## Notes

- All tasks follow TypeScript best practices
- Material-UI v5 conventions used throughout
- Accessibility is a first-class concern
- Performance optimizations applied proactively

**Next Action**: Begin Phase 1, Task 1.1 - Create Component File Structure
