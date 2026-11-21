# Implementation Notes

> Fill this in as part of your submission. 1–2 pages, bullet points are fine. Delete these
> instructions before submitting.

## Task 0 : Initial Description
- The screen shows a list of change requests for the logged in users' organization and clicking on a row will show the details of the request (initially: clicking on the row does not reload the page).
- The models describe the users, request summaries, line items and audit entries, while fixtures provides the data.
- The screen should allow the user to filter the change requests (initially: the filter is not working).
- The detail view compares the baseline and proposed line items, and shows the request timeline.



## 1. What I changed
<!-- Grouped by task: bugs fixed and features implemented (component + template). -->

- Task 1: Fixed the changed flag for a line item in (diff.spec.ts): modified the changed flag to be true when the description or the unit price of an item is changed, rather than only detecting quantity changes. Additionally, Updated the approval and rejection permissions in cr-detail.component.ts and cr-detail.component.spec.ts by reusing the existing approval policy check for both actions. The component now evaluates the current session user's permissions in addition to the CR status before allowing changes. 
- Task 2: Implemented the filter by status logic for CR list in (cr-list.component.ts)
- Task 3:

## 2. Component & state model
<!-- The screens, the view-state each component exposes, and how data flows from the mock API into the
template. -->

- cr-list.component displays the list of change requests and manages filtering.
- cr-detail.component displays the selected change request details, line item comparison, and audit timeline.
- Data is loaded from the mock API service using the provided fixtures and rendered in the corresponding components.
- Status filtering updates visibleRows, which drives the rows displayed in the list view.
- cr-detail.component reloads change request data when the selected request ID changes and exposes the request details, timeline, diff preview, and action state to the template.
- The approval timeline is derived from audit entries and presented chronologically.

## 3. Invariants I keep
<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
|---|---|
| Only users with approval permissions can approve or reject requests | Enforced in cr-detail.component.ts using permission checks |
| Users without approval permissions cannot see rejection actions | Enforced in cr-detail template/UI logic |
| Status filter only displays matching change requests | Enforced when calculating visibleRows in cr-list.component.ts |
| Existing loading, loaded, empty, and error states remain unchanged | Existing state logic preserved in cr-list.component |

## 4. Testing strategy
<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->

- Ran npm tests after each change to verify compilation and ensure no existing functionality was broken.
- Verified line item change detection through the existing diff tests.
- Updated and verified approval/rejection permission tests in cr-detail.component.spec.ts.
- Manually tested status filtering to confirm the table displays only matching change requests.
- Preserved existing loading, loaded, empty, and error state behavior.

## 5. Assumptions
<!-- Where the requirements left room for interpretation, the calls you made and why. -->

-

## 6. Where I used AI

- Used AI assistance for Angular-specific syntax and framework conventions. While I understood the required logic, expected behavior, and where changes needed to be applied, I relied on AI to help with Angular syntax and implementation details.
- Used AI to review and refine the implementation notes and documentation to improve wording, clarity, and the level of detail presented in this submission.

## 7. What I'd improve with more time
-
