// ==UserScript==
// @name         YT Bookmarks
// @namespace    https://github.com/chirag127
// @version      1.0.1
// @description  Named timestamps on any YouTube video, kept in synced storage. Click one to jump there, delete the ones you no longer need.
// @author       chirag127
// @license      MIT
// @match        https://www.youtube.com/*
// @require      https://raw.githubusercontent.com/chirag127/yt-core-lib/main/yt-core-lib-1.4.0.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/yt-bookmarks-userscript/main/yt-bookmarks.user.js
// @updateURL    https://raw.githubusercontent.com/chirag127/yt-bookmarks-userscript/main/yt-bookmarks.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      *
// @noframes
// @run-at       document-idle
// ==/UserScript==

/*
 * One storage key per video: `ytk.bm.<videoId>` = [{ t: seconds, label: text }], in the
 * order the bookmarks were added. ScriptCat's cloud sync carries them between browsers.
 *
 * ONE menu entry: `Settings…` opens the shared settings popup. Adding and jumping are
 * actions, so they live on the toolbar and inside the panel.
 *
 * Seeking sets `video.currentTime` and nothing else: no playlist is touched, no video is
 * liked, and no request leaves the page.
 */

(function () {
  'use strict';

  if (typeof Ytk === 'undefined') { console.error('[yt-bookmarks] core did not load'); return; }
  if (!Ytk.featureOn('bookmarks', true)) return;
  if (location.pathname !== '/watch') return;

  const KEY = 'bm.';
  const LIMIT = 200;
  const BTN = 'font:inherit;font-size:11.5px;padding:4px 9px;border-radius:8px;cursor:pointer;'
    + 'border:1px solid #3a3a3a;background:#262626;color:#eaeaea';

  function raw() { return Ytk.storeGet('settings', {}) || {}; }

  /** Read fresh on every use: an in-app navigation replaces the video without a reload. */
  function videoId() {
    const id = new URLSearchParams(location.search).get('v');
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  function videoTitle() {
    const el = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string');
    return el ? (el.getAttribute('title') || el.textContent || '').trim() : '';
  }

  function fmtTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    if (hours) return hours + ':' + String(minutes).padStart(2, '0') + ':' + String(rest).padStart(2, '0');
    return minutes + ':' + String(rest).padStart(2, '0');
  }

  /** Bookmarks for a video, oldest first, ignoring anything malformed. */
  function list(id) {
    const saved = Ytk.storeGet(KEY + id, []);
    if (!Array.isArray(saved)) return [];
    return saved.filter(function (item) {
      return item && typeof item.t === 'number' && isFinite(item.t) && typeof item.label === 'string';
    });
  }

  function store(id, items) {
    if (items.length) Ytk.storeSet(KEY + id, items);
    else Ytk.storeDel(KEY + id);
  }

  function player() { return document.querySelector('video'); }

  function seek(seconds) {
    const video = player();
    if (!video) { Ytk.toast('The player is not ready yet'); return; }
    video.currentTime = seconds;
    Ytk.toast('Jumped to ' + fmtTime(seconds));
    if (bodyEl) render(bodyEl);
  }

  // ---------------------------------------------------------------- panel

  let bodyEl = null;

  function openBookmarks() {
    if (location.pathname !== '/watch') { Ytk.toast('Open a video first'); return; }
    if (!videoId()) { Ytk.toast('This page has no video id yet'); return; }
    bodyEl = null;
    Ytk.panel('Bookmarks', function (body) {
      bodyEl = body;
      render(body);
    });
  }

  function render(body) {
    const id = videoId();
    const settings = raw();
    const items = id ? list(id) : [];
    const video = player();
    const now = video ? Math.floor(video.currentTime) : null;

    body.textContent = '';
    const title = videoTitle();
    if (title) Ytk.note(body, title);
    Ytk.kv(body, 'Bookmarks on this video', items.length);
    if (now !== null) Ytk.kv(body, 'Playhead now', fmtTime(now));

    const add = Ytk.h('button', { text: 'Add bookmark at current time', style: BTN + ';padding:6px 11px' });
    add.addEventListener('click', addAtCurrent);
    body.appendChild(Ytk.h('div', { style: 'padding:8px 0' }, add));

    if (!id) {
      Ytk.note(body, 'No video id in the address bar, so there is nothing to attach a bookmark to.', 'ytk2-warn');
      return;
    }
    if (!items.length) {
      Ytk.note(body, 'No bookmarks yet. Play to the moment you care about and press the button above.');
      return;
    }

    const ordered = items.map(function (item, position) { return { item: item, position: position }; });
    if (settings.bmSortByTime !== false) {
      ordered.sort(function (a, b) { return a.item.t - b.item.t || a.position - b.position; });
    }

    body.appendChild(Ytk.h('div', { style: 'height:4px;border-top:1px solid #2e2e2e' }));
    ordered.forEach(function (entry) {
      const jump = Ytk.h('button', { text: fmtTime(entry.item.t), style: BTN + ';flex:0 0 auto;font-variant-numeric:tabular-nums' });
      jump.addEventListener('click', function () { seek(entry.item.t); });
      const remove = Ytk.h('button', { text: 'Delete', style: BTN + ';flex:0 0 auto' });
      remove.addEventListener('click', function () { removeOne(id, entry.position); });
      body.appendChild(Ytk.h('div', { class: 'ytk2-row' },
        jump,
        Ytk.h('span', { class: 'grow', text: entry.item.label }),
        remove
      ));
    });

    Ytk.note(body, 'Bookmarks are stored per video id and never sent to YouTube.');
  }

  function addAtCurrent() {
    const id = videoId();
    if (!id) { Ytk.toast('Open a video first'); return; }
    const video = player();
    if (!video) { Ytk.toast('The player is not ready yet'); return; }

    const settings = raw();
    const seconds = Math.max(0, Math.floor(video.currentTime));
    const stamp = fmtTime(seconds);
    const autoLabel = settings.bmAutoLabel !== false;
    const answer = prompt('Name the bookmark at ' + stamp + (autoLabel ? ' — leave it blank to use the timestamp' : ''), autoLabel ? stamp : '');
    if (answer === null) return;

    let label = answer.trim().slice(0, 120);
    if (!label && autoLabel) label = stamp;
    if (!label) { Ytk.toast('A bookmark needs a name'); return; }

    const items = list(id).filter(function (item) { return item.t !== seconds; });
    if (items.length >= LIMIT) { Ytk.toast('This video already has ' + LIMIT + ' bookmarks'); return; }
    items.push({ t: seconds, label: label });
    store(id, items);
    if (bodyEl) render(bodyEl);
    Ytk.toast('Bookmark added at ' + stamp);
  }

  function removeOne(id, position) {
    const items = list(id);
    if (position < 0 || position >= items.length) return;
    items.splice(position, 1);
    store(id, items);
    if (bodyEl) render(bodyEl);
    Ytk.toast('Bookmark deleted');
  }

  // ---------------------------------------------------------------- settings

  function settingsPopup() {
    const before = raw();
    Ytk.openSettings({
      title: 'YT Bookmarks',
      subtitle: 'Named timestamps on the video you are watching. Only the display changes here.',
      sectionTitle: 'Bookmarks',
      fields: [
        {
          key: 'bmAutoLabel',
          label: 'Use the timestamp as the name when the name is left blank',
          type: 'checkbox',
          def: raw().bmAutoLabel !== false,
          hint: 'Turn it off to require a name for every bookmark.'
        },
        {
          key: 'bmSortByTime',
          label: 'List bookmarks in timestamp order',
          type: 'checkbox',
          def: raw().bmSortByTime !== false,
          hint: 'Off keeps them in the order you added them.'
        }
      ],
      actions: [
        { label: 'Open the bookmark panel', run: openBookmarks },
        { label: 'Add a bookmark at the current time', run: addAtCurrent }
      ],
      // Core 1.3.0 rebuilds ytk.settings from its own defaults on save, so merge back.
      onSave: function (next) { Ytk.storeSet('settings', Object.assign({}, before, next)); }
    });
  }

  GM_registerMenuCommand('Settings…', settingsPopup);

  Ytk.mountToolbar([{ label: 'Bookmarks', run: openBookmarks }]);
})();
