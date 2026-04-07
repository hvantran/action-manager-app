# Search Components

## Overview
Real-time action search functionality with debounced API calls and dropdown results.

## Components

### SearchBar
Main search input component with integrated dropdown.

**Props:**
- `onNavigate?: (actionHash: string) => void` - Custom navigation handler
- `debounceMs?: number` - Debounce delay (default: 300ms)
- `minSearchLength?: number` - Minimum search length (default: 2)
- `maxResults?: number` - Maximum results to display (default: 10)

**Features:**
- Debounced search (300ms default)
- Keyboard navigation (Arrow Up/Down, Enter, Escape) - TODO
- Loading states
- Error handling
- Click-outside to close - TODO

### SearchDropdown
Dropdown results container with loading, error, and empty states.

### SearchResultItem
Individual search result item with status chip and metadata.

## Usage

```tsx
import { SearchBar } from './components/search';

function Header() {
  return (
    <SearchBar 
      debounceMs={300}
      minSearchLength={2}
      maxResults={10}
    />
  );
}
```

## API Integration

Uses `SearchService` to call backend endpoint:
- **Endpoint:**GET /v1/actions/search`
- **Authentication:** Required (cookies)
- **Authorization:** Requires ACTION_VIEWER, ACTION_MANAGER, or ADMIN role

## State Management

Uses local component state with React hooks:
- `useState` for search state
- `useEffect` for debounced search
- `useRef` for DOM references
- `useDebounce` custom hook

## Testing

TODO: Add tests in next phase
- Unit tests for SearchService
- Component tests for SearchBar
- Integration tests for keyboard navigation

## Implementation Status

**Day 1 - Design Phase (Complete):**
- ✅ Component structure created
- ✅ TypeScript interfaces defined
- ✅ Service layer created
- ✅ Debounce hook implemented
- ✅ UI components created (placeholders)

**Next Phase - Implementation:**
- ⏳ Search logic implementation
- ⏳ Keyboard navigation
- ⏳ Integration with header
- ⏳ Unit tests
