# AGENTS.md — yt-bookmarks-userscript

Read the collection [`AGENTS.md`](../AGENTS.md) and [`PLAN.md`](../PLAN.md) first. Documentation
lives once in the umbrella repo at `c:\ws\docs\okf\` — do not copy it here.

## Rules for this script

1. Requires `yt-core-lib`. Never copy storage, InnerTube or UI code here.
2. **EXACTLY ONE context-menu entry**: `Settings…` calling `Ytk.openSettings({...})`. Adding,
   seeking and deleting a bookmark are *actions*: they live on the toolbar and inside the panel.
   The old toolkit had two bookmark menu entries; that is exactly what the one-entry rule bans.
3. The action button comes from `Ytk.mountToolbar`. Never draw a bar or a floating widget, and do not
   add markers onto the player's progress bar.
4. No `innerHTML` — YouTube enforces Trusted Types and the throw is silent inside handlers.
5. **Read-only towards YouTube.** The only write is its own bookmark key in GM storage.
6. Storage is exactly `Ytk.storeSet('bm.' + videoId, [{ t, label }])` → `ytk.bm.<videoId>`, sorted by
   `t`. Deleting the last bookmark is `Ytk.storeDel`, so an empty array never lingers.
7. Gate on `Ytk.featureOn('bookmarks', true)` and return early when off; then guard on the page
   (no `?v=` → return).
8. Read `?v=` **at click time**, never cache it at boot: YouTube is an SPA and the toolbar is mounted
   once per page load while the video id changes.
9. Every delete re-reads the stored list and splices by the index the panel drew, so a note saved in
   another tab cannot shift the deletion onto the wrong row.

## Verified DOM facts

- Current video id: `new URLSearchParams(location.search).get('v')`.
- Player position: `document.querySelector('video').currentTime`. Guard for a missing player — the
  watch page renders before the element exists, and an ad video element is still a `video`.
- Timestamps are stored in whole seconds; `currentTime` is a float and must be floored, or every
  bookmark looks unique when compared.

## Known limitation

The panel refreshes itself after each add or delete, but not when the SPA changes video with the panel
still open — close and reopen it, or press the toolbar button again.

## Not verified live

Seeking by `video.currentTime` and the optional `pause()` assume YouTube does not rewrite the position
immediately afterwards (it does not in the old toolkit's testing, but that was not re-verified for
this standalone script).

## Shared toolbar caveat (core 1.2.0)

Each userscript runs in its own sandbox, so the core's `toolbarEl` module state is **per script**.
With several collection scripts installed, core 1.2.0 therefore draws one `.ytk2-bar` per script, all
at `left:16px;bottom:16px` — they overlap and only the top one is clickable. Core **1.3.0** fixes it
by reusing the bar already in the DOM (`toolbarEl = document.querySelector('.ytk2-bar')`).

This repo pins the versioned `yt-core-lib-1.2.0.js` URL on purpose (immutable require, no surprise
core changes). When the collection moves to 1.3.0 on `main`, bump the `@require` here in the same
commit as the rest — do not point at the unversioned `yt-core-lib.js`.
