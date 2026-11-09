# YT Bookmarks

Named timestamps on a video: "chorus at 1:12", "the bit about the car".

- The **Bookmarks** button on the shared toolbar opens a panel with every bookmark on the video.
- A bookmark's timestamp is a button — click it and the player jumps to that second.
- **Delete** removes one bookmark. **Add bookmark at current time** reads the playhead, asks for a
  name, and saves it.
- Bookmarks live in ScriptCat storage as `ytk.bm.<videoId>` = `[{ t: seconds, label: text }]`, so
  ScriptCat's cloud sync carries them to another browser.

Clicking a timestamp sets `video.currentTime` and nothing else. No playlist, like, comment or
request is involved; if the player has not loaded yet the panel says so instead of failing silently.

## Where it runs

- `youtube.com/watch?v=…` only.

If you reach a watch page by an in-app navigation (clicking a video on the home feed) the page type
check already ran on the previous URL and the script stays out of the way until you reload. Opening
a video from a link, a new tab or a reload is unaffected.

## Settings

One entry — **Settings…** — opens the shared settings popup.

| Field | Key | Default | Purpose |
|---|---|---|---|
| Use the timestamp as the name when the name is left blank | `bmAutoLabel` | on | blank name becomes `4:20`; turn it off to require a name |
| List bookmarks in timestamp order | `bmSortByTime` | on | off keeps them in the order you added them |

The popup also offers **Open the bookmark panel** and **Add a bookmark at the current time**.

## Notes

- Up to 200 bookmarks per video. Adding at a second that already has a bookmark replaces that one
  rather than stacking duplicates.
- A bookmark is stored against the video id, so it survives the video being moved between
  playlists — and it follows you to the same video opened from a different playlist.
- Deleting the last bookmark removes the storage key instead of leaving an empty list behind.

## What it does not do

- It does not create YouTube chapters, cards or comments. Those are the uploader's fields.
- It does not sync with the account. Storage is ScriptCat's, carried by its cloud backup.
- It does not touch the watch history or the resume position.

## Install

Follow the [install guide](https://github.com/chirag127/userscript-install-guide). The script
`@require`s [yt-core-lib](https://github.com/chirag127/yt-core-lib), which is never installed on
its own.

## Docs

Collection documentation is single-sourced in the workspace bundle: `c:\ws\docs\okf\`.
