# AGENTS.md — YT Bookmarks

Read the collection rules first: [`../AGENTS.md`](../AGENTS.md). Documentation lives once in
`c:\ws\docs\okf\` — do not create an `okf/` copy here.

## What this repo is

One userscript, one job: named timestamps on the video currently being watched, with jump and
delete. The only YouTube surface it touches is the player's `currentTime`.

## Non-negotiables

1. **Exactly one context-menu entry**, `Settings…`, calling `Ytk.openSettings` — nothing else.
2. **No `innerHTML`.** The list is drawn with `Ytk.kv`, `Ytk.note` and `Ytk.h`.
3. **Shared toolbar only:** `Ytk.mountToolbar([{ label: 'Bookmarks', run: openBookmarks }])`.
4. **One storage key per video**: `ytk.bm.<videoId>` = `[{ t, label }]`. Empty list ⇒
   `Ytk.storeDel`, never a stored empty array.
5. **Seeking is the whole write surface.** `video.currentTime = t`; no `play()`, no playlist call,
   no API call. There is no write endpoint in this script at all.
6. **Core is required, pinned:** `@require …/yt-core-lib-1.3.0.js`. No core helper is
   re-implemented — this script only adds time formatting, which the core does not have.

## Why the code looks the way it does

- **The video id is read fresh on every use**, never captured at boot. YouTube replaces the video
  on an in-app navigation without reloading the page, so a cached id would silently save a bookmark
  against the wrong video.
- **`position` is carried through the sort.** Bookmarks are stored in insertion order; when
  `bmSortByTime` sorts a copy for display, each entry keeps its original index so **Delete** still
  removes the right one.
- **Auto-labelling is a prompt default, not a silent guess.** With `bmAutoLabel` on, the dialog opens
  pre-filled with the timestamp and a blank answer falls back to it; with it off, a blank answer is
  refused with a toast instead of storing an unnamed row.
- **Duplicates are replaced.** Adding at a second that already holds a bookmark overwrites it, so
  pressing the button twice does not create two identical rows.
- **`raw()`, not `Ytk.settings()`, for this script's own keys.** `Ytk.settings()` returns only the
  core's own `DEFAULTS` keys, so `bmAutoLabel` and `bmSortByTime` are read from
  `Ytk.storeGet('settings', {})`, and each field's `def` is seeded from that blob so the popup shows
  the saved value instead of a hard-coded default.
- **Settings survive because of `onSave`.** Core 1.3.0's save path rebuilds `ytk.settings` from the
  core defaults and drops unknown keys; the `onSave` merge puts the two `bm*` keys back.
- **Page guard is a URL test at `document-idle`.** The README states the consequence plainly: an
  in-app navigation onto a watch page needs a reload for the toolbar to appear. Do not "fix" this by
  dropping the guard — the collection rule requires one.
- **The AI grants stay.** The settings popup renders the shared AI section, which calls
  `GM_xmlhttpRequest`; without `@grant GM_xmlhttpRequest` + `@connect *` its test fails.

## Verification before claiming a change works

```bash
node --check yt-bookmarks.user.js
grep -c "GM_registerMenuCommand('Settings…', settingsPopup);" yt-bookmarks.user.js   # 1
grep -c "innerHTML" yt-bookmarks.user.js                                            # 0
```

Then check it on a real video: add a bookmark at 0:30, jump away, click it back, reload and confirm
it is still listed, toggle **List bookmarks in timestamp order** off and confirm the order follows
insertion, then delete it and confirm the key is gone from storage. Static checks alone are not a
live test.
