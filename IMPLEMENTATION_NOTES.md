# Implementation Notes

> Fill this in as part of your submission. 1–2 pages, bullet points are fine. Delete these
> instructions before submitting.

## Task 0 : 
- The screen shows a list of change requests for the logged in users' organization and clicking on a row will show the details of the request (initially: clicking on the row does not reload the page).
- The models describe the users, request summaries, line items and audit entries, while fixtures provides the data.
- The screen should allow the user to filter the change requests (initially: the filter is not working).
- The detail view compares the baseline and proposed line items, and shows the request timeline.



## 1. What I changed
<!-- Grouped by task: bugs fixed and features implemented (component + template). -->

- Task 1: Fixed the changed flag for a line item in (diff.spec.ts): modified the changed flag to be true when the description or the unit price of an item is changed, rather than only detecting quantity changes. Additionally, Updated the approval and rejection permissions in cr-detail.component.ts and cr-detail.component.spec.ts by reusing the existing approval policy check for both actions. The component now evaluates the current session user's permissions in addition to the CR status before allowing changes. 

## 2. Component & state model
<!-- The screens, the view-state each component exposes, and how data flows from the mock API into the
template. -->

-

## 3. Invariants I keep
<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
|---|---|

## 4. Testing strategy
<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->

-

## 5. Assumptions
<!-- Where the requirements left room for interpretation, the calls you made and why. -->

-

## 6. Where I used AI
-

## 7. What I'd improve with more time
-
