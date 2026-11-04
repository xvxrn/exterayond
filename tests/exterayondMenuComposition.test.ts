/**
 * The 075 menu-composition surfaces: the text-style keys over the composer
 * formatting tooltip (MENU-06), the media viewer menu's Forward row (MENU-07)
 * and the selection bar's forward button (MENU-08). Each is a composition
 * toggle over an existing owner — off = the stock surface — and each owner
 * re-reads the store live: the tooltip on every open (its show() rewrite of
 * the per-button `hide`), the viewer on every visibility pass (which rewrites
 * each menu item's `verify`), the selection bar on every selection session
 * (which rebuilds the bar). The mapping table is the store's
 * `FORMAT_TOOLTIP_TOGGLE_KEYS`; the three consumption points are pinned the
 * way the audio glyph suite pins its row (a source contract, the mounts being
 * chat/manager-heavy).
 */

import {readFile} from 'fs/promises';

const TOOLTIP_PATH = 'src/components/chat/markupTooltip.ts';
const VIEWER_PATH = 'src/components/mediaViewer/index.ts';
const SELECTION_PATH = 'src/components/chat/selection.ts';

describe('FORMAT_TOOLTIP_TOGGLE_KEYS (MENU-06)', () => {
  test('maps the eight tooltip buttons the Android Text* keys own', async() => {
    const {FORMAT_TOOLTIP_TOGGLE_KEYS} = await import('@stores/exterayondSettings');
    // * the persisted Android names are the contract (NaConfig, all bool
    // * default true): TextBold, TextItalic, TextUnderline, TextStrikethrough,
    // * TextQuote, TextSpoiler, TextLink, TextCreateDate
    expect(FORMAT_TOOLTIP_TOGGLE_KEYS).toEqual({
      bold: 'TextBold',
      italic: 'TextItalic',
      underline: 'TextUnderline',
      strikethrough: 'TextStrikethrough',
      quote: 'TextQuote',
      spoiler: 'TextSpoiler',
      link: 'TextLink',
      date: 'TextCreateDate'
    });
  });

  test('the tooltip re-reads the toggle on every open, in the same pass that hides unavailable buttons', async() => {
    const source = await readFile(TOOLTIP_PATH, 'utf-8');
    // * the hidden computation composes the mapping and reads the store live
    // * (a captured boolean would freeze the gate at the first open)
    expect(source).toMatch(/FORMAT_TOOLTIP_TOGGLE_KEYS\[type as keyof typeof FORMAT_TOOLTIP_TOGGLE_KEYS\]/);
    expect(source).toMatch(/!!formatToggle && !exterayondSettings\[formatToggle\]/);
    // * the monospace, highlight, subscript and superscript buttons have no
    // * 1:1 Android key and must stay out of the mapping
    expect(source).not.toMatch(/monospace.*TextMonospace/);
  });
});

describe('the media viewer menu gate (MENU-07)', () => {
  test('the Forward menu item composes the toggle into every visibility pass', async() => {
    const source = await readFile(VIEWER_PATH, 'utf-8');
    // * setMessageActionVisibility rewrites each menu item's verify per
    // * message; the gate must live inside that rewrite and read the store
    // * when the menu actually opens
    expect(source).toMatch(/button === this\.btnMenuForward && !exterayondSettings\.MediaViewerMenuItemForward/);
  });
});

describe('the selection bar gate (MENU-08)', () => {
  test('the forward button is built with the toggle applied, per selection session', async() => {
    const source = await readFile(SELECTION_PATH, 'utf-8');
    // * the bar is rebuilt on every selection; the gate sits at the build of
    // * the forward button and must not touch the scheduled send-now button
    expect(source).toMatch(/selectionForwardBtn\.classList\.toggle\('hide', !exterayondSettings\.ActionBarButtonForward\)/);
    expect(source).not.toMatch(/selectionSendNowBtn\.classList\.toggle\('hide', !exterayondSettings/);
  });
});
