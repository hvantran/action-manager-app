# Design - Footer Component Implementation

## Architecture Overview

### Component Structure
```
App.js (Layout Container)
├── PrimarySearchAppBar (Header)
├── Routes (Main Content)
└── Footer (New Component) ← To be added
```

### Component Hierarchy
```
Footer.jsx
├── Box (MUI Container with semantic footer tag)
    ├── Container (MUI Responsive Container)
        ├── Grid (MUI Grid for responsive layout)
            ├── Copyright Text (Grid Item)
            ├── Version Info (Grid Item)
            └── Links Section (Grid Item)
                ├── GitHub Link
                ├── License Link
                └── Documentation Link
```

## Technical Design

### Component: Footer.jsx

**Location:** `/services/action-manager-app/action-manager-ui/src/components/common/Footer.jsx`

**Responsibilities:**
- Display copyright information with dynamic year
- Show application version from package.json
- Provide navigation links to external resources
- Respond to theme changes (light/dark mode)
- Maintain responsive layout across devices

**Props:** None (self-contained component)

**State:** None (uses package.json for version)

### Data Flow

```
package.json (version) → Footer Component → Rendered Footer
                              ↓
                       Theme Context (from MUI ThemeProvider)
```

### Interface Design

**Footer Layout (Desktop):**
```
┌─────────────────────────────────────────────────────────────┐
│  © 2026 Action Manager  |  v0.1.0  |  GitHub • License • Docs │
└─────────────────────────────────────────────────────────────┘
```

**Footer Layout (Mobile):**
```
┌──────────────────────┐
│  © 2026 Action Manager │
│  Version 0.1.0       │
│  GitHub • License    │
│  Documentation       │
└──────────────────────┘
```

### Styling Specifications

**Typography:**
- Font size: 12px (0.75rem)
- Font family: Inherit from theme
- Line height: 1.5

**Spacing:**
- Padding: 16px (theme.spacing(2))
- Margin top: 32px (theme.spacing(4))
- Border top: 1px solid divider color

**Colors:**
- Light mode: Background: #fafafa, Text: rgba(0, 0, 0, 0.6)
- Dark mode: Background: #1e1e1e, Text: rgba(255, 255, 255, 0.7)
- Links: Primary color from theme

**Responsive Breakpoints:**
- Mobile (xs): Stack vertically, center align
- Tablet (sm+): Single row, space between
- Desktop (md+): Single row, space between with more padding

### App.js Integration

**Current Structure:**
```jsx
<ThemeProvider theme={theme}>
  <CssBaseline />
  <Stack>
    <PrimarySearchAppBar />
    <Routes>...</Routes>
  </Stack>
  <ToastContainer />
</ThemeProvider>
```

**New Structure:**
```jsx
<ThemeProvider theme={theme}>
  <CssBaseline />
  <Stack sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <PrimarySearchAppBar />
    <Box sx={{ flexGrow: 1 }}>
      <Routes>...</Routes>
    </Box>
    <Footer />
  </Stack>
  <ToastContainer />
</ThemeProvider>
```

## Error Handling

| Error Scenario | Handling Strategy | Expected Response |
|---------------|-------------------|-------------------|
| Version unavailable | Use fallback value | Display "v0.1.0" |
| External link fails | Browser handles | Standard 404/error |
| Theme undefined | Use default styling | Apply light theme |

## Implementation Considerations

### Decision 1: JavaScript vs TypeScript
**Decision:** Use JavaScript (.jsx)
**Rationale:** 
- App.js is already in JavaScript
- Other simple components (ErrorPage.jsx) use JavaScript
- No complex type requirements for this component
- Consistency with existing simple components

### Decision 2: Sticky vs Regular Footer
**Decision:** Regular footer (not sticky/fixed)
**Rationale:**
- Better UX for long pages (doesn't cover content)
- Simpler implementation with flexbox
- Standard practice for application footers
- Uses CSS flexbox to stay at bottom naturally

### Decision 3: Version Source
**Decision:** Hardcode reference to package.json version
**Rationale:**
- package.json is always available in React builds
- Direct import is simple and reliable
- No need for environment variables or API calls

### Decision 4: Link Destinations
**Decision:** Use these specific links:
- GitHub: https://github.com/hvantran/action-manager-app
- License: /LICENSE (relative path)
- Docs: README.md in repository
**Rationale:**
- Based on repository structure
- LICENSE file exists in project root
- README serves as documentation

## Testing Strategy

### Manual Testing Checklist
1. **Visual Testing:**
   - [ ] Footer displays on all routes
   - [ ] Copyright year is correct (2026)
   - [ ] Version matches package.json
   - [ ] Links are clickable and styled correctly

2. **Responsive Testing:**
   - [ ] Mobile view: Stacked layout
   - [ ] Tablet view: Horizontal layout
   - [ ] Desktop view: Horizontal with padding

3. **Theme Testing:**
   - [ ] Light mode: Proper colors and contrast
   - [ ] Dark mode: Proper colors and contrast
   - [ ] Theme toggle: Smooth transition

4. **Position Testing:**
   - [ ] Short content: Footer at bottom of viewport
   - [ ] Long content: Footer at end of content
   - [ ] Scrolling: Footer visible when scrolled to bottom

5. **Accessibility Testing:**
   - [ ] Keyboard navigation: Links focusable
   - [ ] Screen reader: Footer announced correctly
   - [ ] Contrast ratio: Meets WCAG AA (4.5:1)

### Automated Testing
- Unit tests can be added later for version extraction logic
- Focus on manual validation for UI/UX in this phase

## Performance Considerations
- Component is lightweight (no heavy computations)
- No API calls or async operations
- Minimal re-renders (no state changes)
- Small bundle size impact

## Accessibility Features
- Semantic `<footer>` HTML element
- Proper link labels and href attributes
- Sufficient color contrast in both themes
- Keyboard accessible links
- Logical tab order

## Migration Path
1. Create Footer.jsx component
2. Import Footer in App.js
3. Modify App.js layout structure (Stack → flexbox)
4. Test on all routes and devices
5. Validate accessibility
