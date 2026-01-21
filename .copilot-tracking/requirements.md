# Requirements Specification: Action Manager - Add ARCHIVED Column

## Document Information
- **Created**: 2026-01-21
- **Feature**: Add ARCHIVED Column to Action Board View
- **Version**: 1.0
- **Status**: Implementation Ready

## Executive Summary
Add a new "ARCHIVED" column to the existing Action Manager board view to display archived actions separately from active, paused, and deleted actions.

## Requirements (EARS Notation)

### R1: ARCHIVED Column Addition
**R1.1** THE SYSTEM SHALL add a fifth status column named "ARCHIVED" to the board view.

**R1.2** THE SYSTEM SHALL display archived actions in the ARCHIVED column.

**R1.3** WHEN displaying the ARCHIVED column, THE SYSTEM SHALL show the count of archived actions in the column header.

**R1.4** THE SYSTEM SHALL position the ARCHIVED column after the DELETED column (rightmost position).

### R2: Archived Actions Display
**R2.1** THE SYSTEM SHALL display archived actions as cards with the same structure as other action cards (priority, title, description, metrics, progress).

**R2.2** THE SYSTEM SHALL apply a distinct visual style to the ARCHIVED column to differentiate it from active columns.

**R2.3** WHEN an action is archived from the table view, THE SYSTEM SHALL display it in the ARCHIVED column of the board view.

### R3: Column Styling
**R3.1** THE SYSTEM SHALL use a muted color scheme for the ARCHIVED column header (gray tones).

**R3.2** THE SYSTEM SHALL use an appropriate icon for the ARCHIVED status (e.g., ArchiveIcon).

**R3.3** THE SYSTEM SHALL maintain consistent spacing and layout with existing columns.

### R4: Responsive Behavior
**R4.1** THE SYSTEM SHALL include the ARCHIVED column in responsive layout calculations.

**R4.2** ON mobile devices (< 768px), THE SYSTEM SHALL stack the ARCHIVED column vertically with other columns.

**R4.3** ON tablet devices (768px - 1024px), THE SYSTEM SHALL adjust grid layout to accommodate 5 columns.

**R4.4** ON desktop devices (> 1024px), THE SYSTEM SHALL display all 5 columns horizontally with horizontal scroll if needed.

### R5: Data Integration
**R5.1** THE SYSTEM SHALL filter actions with status "ARCHIVED" into the ARCHIVED column.

**R5.2** THE SYSTEM SHALL support search filtering across the ARCHIVED column.

**R5.3** THE SYSTEM SHALL include archived actions in the auto-refresh cycle.

## Success Criteria

### Functional Success
- ✓ ARCHIVED column displays correctly in board view
- ✓ Archived actions appear in the ARCHIVED column
- ✓ Column count displays accurate number of archived actions
- ✓ Search filtering works across ARCHIVED column

### Visual Success
- ✓ ARCHIVED column styling is consistent with other columns
- ✓ Visual differentiation from active columns is clear
- ✓ Responsive behavior works on all device sizes

### Quality Success
- ✓ No regression in existing board view functionality
- ✓ Performance remains acceptable with 5 columns
- ✓ Accessibility standards maintained

## Implementation Notes

**Files to Modify**:
- `BoardView.tsx` - Add ARCHIVED to status columns
- `BoardColumn.tsx` - Add ARCHIVED styling configuration
- `GenericConstants.tsx` - Add ARCHIVED to status color mapping

**Estimated Effort**: 1-2 hours

---

**Status**: Ready for implementation
**Next Step**: Update design.md and begin implementation
