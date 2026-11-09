# YT Bookmarks

Named timestamps per video. One toolbar button opens the panel; click a timestamp to seek, delete a
bookmark from the same panel.

## Where it runs

Watch pages (`/watch?v=…`). The video id is read from the URL at click time, so it keeps working when
YouTube moves from one video to the next without reloading.

## Install

Read the [install guide](https://github.com/chirag127/userscript-install-guide), then:

```
https://github.com/chirag127/yt-bookmarks-userscript/raw/main/yt-bookmarks.user.js
```

Requires [`yt-core-lib`](https://github.com/chirag127/yt-core-lib), pulled in with `@require`.
You do not install the core yourself.

## Use it

One toolbar button, **Bookmarks**:

- **＋ Add at 12:34** — bookmarks the current player position. Leave the name blank and the timestamp
  becomes the label.
- Click a timestamp to seek to it.
- **✕** deletes that bookmark.

## Settings

Exactly one context-menu entry, called **Settings…**:

| Setting | Default | Meaning |
|---|---|---|
| Use the timestamp as the label when the name is left blank | on | turn off to require a name |
| Pause the video after seeking | off | review a bookmark instead of playing through it |
| Show a small toast when you seek | on | |
| Ask before deleting a bookmark | off | |
| Bookmarks in the panel | 40 | |

## Storage

| Key | Value |
|---|---|
| `ytk.bm.<videoId>` | `[{ t, label }]`, `t` in whole seconds, sorted ascending |

ScriptCat's cloud sync replicates script storage, so bookmarks follow you between browsers. Nothing
is written to YouTube.

## What it does NOT do

- It does not download, annotate or modify the video, and it makes no network request.
- It does not draw markers on the player progress bar (that would need page chrome the collection
  forbids; the panel is the surface).
- It does not keep a "recently bookmarked" list across videos.

## License

MIT
