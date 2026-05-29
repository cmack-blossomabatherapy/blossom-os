## Add "Write to NFC Tag" button

Add a button next to the generated NFC link so an admin can tap a blank NFC tag to their Android phone and program it in one step — no TagWriter app needed.

### Scope (one file)

`src/pages/os/users/EmployeeProfile.tsx` → `NfcTab`:

- Add **"Write to NFC Tag"** button next to Copy URL / QR
- Uses browser's built-in `NDEFReader` (Web NFC)
- On click: shows modal *"Hold an NFC tag to the back of your phone…"*, writes the public badge URL, toasts success/error
- Disabled with tooltip on iPhone/desktop (Web NFC is Android Chrome only); existing Copy URL + TagWriter path remains as fallback
- Add minimal `NDEFReader` TS declaration locally

### Not included

- No DB changes, no new dependencies, no migrations
- No iPhone-native writer (Apple doesn't expose Web NFC)
- No bulk writing or tag locking (can add later)

### Reality check

| Platform | Works? |
|---|---|
| Chrome on Android | Yes |
| iPhone Safari | No — fallback to Copy URL + TagWriter |
| Desktop | No — no NFC hardware |
