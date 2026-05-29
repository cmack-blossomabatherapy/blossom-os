I checked the current backend and the new lookup works for the active tag code `NFC-IAZHR5`, so the problem is likely the physical NFC tag still has an old/wrong URL written to it, or the public NFC page is calling the wrong route format from that old URL.

Plan:

1. Make the NFC admin tab clearer
   - Show the exact current URL that should be on the tag.
   - Add a stronger warning/status if the active tag exists but the physical tag may still need to be rewritten.
   - Keep the existing “Write to NFC tag” button as the primary action.

2. Add backward-compatible lookup support
   - Update the public badge page to normalize common scanned values so old links still resolve when possible:
     - `/nfc/NFC-IAZHR5`
     - `/nfc/0f7e72d1-2f0f-4509-9095-f3f420abb24d`
     - older employee codes like `dir-corey-mack`
   - Keep revoked/inactive tag codes blocked.

3. Improve the “not recognized” state
   - Replace the generic error with a clearer message that explains the tag may need to be rewritten.
   - Add a visible support fallback for current employees.

4. Verify with the current active tag
   - Confirm the active database tag resolves through the public lookup.
   - Confirm the generated URL format matches what the NFC writer writes.

Important: you do not need a brand-new link if the active URL is `https://blossom.abacommandcenter.com/nfc/NFC-IAZHR5`; you likely need to rewrite the physical NFC tag so it stops opening the old URL.