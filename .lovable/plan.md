# Fix: Phone Routing Directory inputs lose focus after one character

## Root cause

In `src/pages/phone/PhonePages.tsx` (`PhoneDirectory`, lines ~514–528), two components are defined **inside** the parent component body:

- `EditableTitle` (the editable section-title `Input`)
- `AddRowButton`

Because they are re-created on every render, React sees a brand new component type each keystroke, unmounts the old `<Input>` and mounts a fresh one. The DOM input loses focus, so the user has to click back in after every character.

The cell-level `<Input>` elements in the tables don't have this problem because they're inline JSX, not nested component definitions — which matches the user's report that the focus loss happens on the editable section titles.

## Fix

Move `EditableTitle` and `AddRowButton` out of `PhoneDirectory` into module-scope components, and pass the state they need (`editing`, `draftLabels`, `setDraftLabels`, `directoryLabels`, plus `onClick`/`label`) as props.

```text
// before:  inside PhoneDirectory
const EditableTitle = ({ field }) => editing ? <Input .../> : <CardTitle .../>

// after:   module scope
function EditableTitle({ editing, field, labels, draftLabels, setDraftLabels }) { ... }
```

Then update the ~6 call sites inside `PhoneDirectory` to pass the needed props. No behavioral or styling changes — only the component definitions move.

This restores stable React component identity, so the `<Input>` keeps focus while typing.

## Files

- `src/pages/phone/PhonePages.tsx` — extract `EditableTitle` and `AddRowButton` to module scope; update call sites.

## Verification

- Type continuously in any editable section title in the Routing Directory; focus stays in the input.
- Add Row / delete row / save still work; no type errors.
