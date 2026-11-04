/**
 * PLAYER-06, `OEPlayerCoverSwipe`: the MD3 player popup's cover swipe. The
 * pointer mechanics live in `md3PlayerCoverSwipe.ts` (the CHAT-26 predicate
 * treatment) and are driven here for real on a plain element with synthetic
 * pointer events; the release threshold and the drag visuals are the ported
 * Android constants; the popup's wiring (the live store gate, the track
 * switch through the playback controller, the motion-level animations and
 * the touch-action scoping) is pinned as a source contract — the mounts
 * being popup-graph-heavy, the way the menu-composition suite pins its
 * consumption points.
 */

import {readFile} from 'fs/promises';

import {
  attachCoverSwipe,
  coverSwipeDragVisual,
  coverSwipeRelease,
  COVER_DRAG_FADE,
  COVER_DRAG_ROTATE,
  COVER_DRAG_SLOP,
  COVER_DRAG_SWITCH
} from '@components/popups/md3PlayerCoverSwipe';

type RecordedDrag = {dxs: number[], finished: number[]};

const makeCover = (allowed: () => boolean = () => true) => {
  const element = document.createElement('div');
  // * jsdom has no Pointer Events; the real browser always does
  (element as any).setPointerCapture = () => {};
  const record: RecordedDrag = {dxs: [], finished: []};
  attachCoverSwipe(element, {
    allowed,
    onDrag: (dx) => record.dxs.push(dx),
    onFinish: (dx) => record.finished.push(dx)
  });
  return {element, record};
};

const pointer = (type: string, x: number, y: number, pointerId = 1) => {
  const event = new Event(type, {bubbles: true});
  Object.assign(event, {pointerId, clientX: x, clientY: y});
  return event as PointerEvent;
};

describe('the pointer mechanics (Android onCoverTouch)', () => {
  test('arms past the slop on a horizontal intent, counting from the armed point', () => {
    const {element, record} = makeCover();
    element.dispatchEvent(pointer('pointerdown', 100, 50));
    // * within the slop: not armed yet
    element.dispatchEvent(pointer('pointermove', 106, 50));
    expect(record.dxs).toEqual([]);
    // * past the slop horizontally: armed, the origin resets here
    element.dispatchEvent(pointer('pointermove', 112, 50));
    expect(record.dxs).toEqual([0]);
    element.dispatchEvent(pointer('pointermove', 102, 50));
    expect(record.dxs).toEqual([0, -10]);
    element.dispatchEvent(pointer('pointerup', 102, 50));
    expect(record.finished).toEqual([-10]);
  });

  test('a vertical intent abandons the drag entirely', () => {
    const {element, record} = makeCover();
    element.dispatchEvent(pointer('pointerdown', 100, 50));
    element.dispatchEvent(pointer('pointermove', 100, 70));
    element.dispatchEvent(pointer('pointermove', 180, 70));
    element.dispatchEvent(pointer('pointerup', 180, 70));
    expect(record.dxs).toEqual([]);
    expect(record.finished).toEqual([]);
  });

  test('a shallow horizontal move that turns vertical cancels at the first vertical step', () => {
    const {element, record} = makeCover();
    element.dispatchEvent(pointer('pointerdown', 100, 50));
    // * horizontal first but shallow (within the slop), then vertical past it
    element.dispatchEvent(pointer('pointermove', 104, 60));
    element.dispatchEvent(pointer('pointermove', 200, 60));
    element.dispatchEvent(pointer('pointerup', 200, 60));
    expect(record.dxs).toEqual([]);
    expect(record.finished).toEqual([]);
  });

  test('a cancelled pointer reports the spring-back release, like ACTION_CANCEL', () => {
    const {element, record} = makeCover();
    element.dispatchEvent(pointer('pointerdown', 100, 50));
    element.dispatchEvent(pointer('pointermove', 200, 50));
    element.dispatchEvent(pointer('pointercancel', 200, 50));
    expect(record.finished).toEqual([0]);
  });

  test('a second pointer never drags', () => {
    const {element, record} = makeCover();
    element.dispatchEvent(pointer('pointerdown', 100, 50));
    element.dispatchEvent(pointer('pointermove', 300, 50, 2));
    element.dispatchEvent(pointer('pointerup', 300, 50, 2));
    expect(record.dxs).toEqual([]);
    expect(record.finished).toEqual([]);
  });

  test('the per-down gate: off skips the gesture and a later down works again', () => {
    let allowed = false;
    const {element, record} = makeCover(() => allowed);
    element.dispatchEvent(pointer('pointerdown', 100, 50));
    element.dispatchEvent(pointer('pointermove', 200, 50));
    element.dispatchEvent(pointer('pointerup', 200, 50));
    expect(record.finished).toEqual([]);
    allowed = true;
    element.dispatchEvent(pointer('pointerdown', 100, 50));
    // * the arming move resets the origin (dx 0), the next one carries the drag
    element.dispatchEvent(pointer('pointermove', 200, 50));
    expect(record.dxs).toEqual([0]);
    element.dispatchEvent(pointer('pointermove', 120, 50));
    element.dispatchEvent(pointer('pointerup', 120, 50));
    expect(record.finished).toEqual([-80]);
  });
});

describe('the release and drag visuals (Android finishCoverDrag / setCoverDrag)', () => {
  test('the switch threshold: under dp(70) springs back, past it the direction decides', () => {
    // * dx=0 (the cancelled pointer) and shallow drags spring back; the
    // * spring's `next` value is never consumed
    expect(coverSwipeRelease(0)).toEqual({switch: false, next: false});
    expect(coverSwipeRelease(COVER_DRAG_SWITCH - 1)).toEqual({switch: false, next: false});
    // * left is next, right is previous — a physical gesture, not mirrored
    expect(coverSwipeRelease(-COVER_DRAG_SWITCH)).toEqual({switch: true, next: true});
    expect(coverSwipeRelease(COVER_DRAG_SWITCH)).toEqual({switch: true, next: false});
  });

  test('the drag visual: the non-disc cover rotates by dx / dp(40), the disc only slides', () => {
    expect(coverSwipeDragVisual(-30, false)).toEqual({
      transform: 'translateX(-30px) rotate(' + -30 / COVER_DRAG_ROTATE + 'deg)',
      opacity: String(1 - 30 / COVER_DRAG_FADE)
    });
    const disc = coverSwipeDragVisual(-30, true);
    expect(disc.transform).toBe('translateX(-30px)');
    expect(disc.opacity).toBe(String(1 - 30 / COVER_DRAG_FADE));
  });

  test('the fade bottoms out at 0.4, like Android min(|dx| / dp(420), 0.4)', () => {
    expect(coverSwipeDragVisual(-1000, true).opacity).toBe('0.6');
    expect(coverSwipeDragVisual(0, true).opacity).toBe('1');
  });
});

describe('the popup wiring (source contract)', () => {
  const POPUP_PATH = 'src/components/popups/md3Player.tsx';
  const TAB_PATH = 'src/components/sidebarLeft/tabs/exterayondAppearanceTab.tsx';

  test('the store gate is read at every pointerdown and the switch routes through the controller', async() => {
    const source = await readFile(POPUP_PATH, 'utf-8');
    // * the allowed() gate mirrors Android's early return: animating out, or
    // * a cover style outside card/disc, or the key off — the store read is
    // * inside the callback, so the toggle applies live
    expect(source).toMatch(/allowed: \(\) => !coverAnimating && framed\(\) && !!exterayondSettings\.OEPlayerCoverSwipe/);
    // * the track switch goes through the playback controller under the
    // * session guard, the same path the next/previous buttons take
    expect(source).toMatch(/const switchTrack = \(next: boolean\) => run\(\(\) => next \? controller\.next\(\) : controller\.previous\(\)\);/);
    expect(source).toMatch(/switchTrack\(release\.next\)/);
    // * the timings and easings are Android's 180/450 EASE_IN / EMPHASIZED
    expect(source).toMatch(/const COVER_OUT_MS = 180;/);
    expect(source).toMatch(/const COVER_IN_MS = 450;/);
    expect(source).toMatch(/cubic-bezier\(\.42, 0, 1, 1\)/);
    expect(source).toMatch(/cubic-bezier\(\.2, 0, 0, 1\)/);
  });

  test('the touch-action change exists only while the swipe is on', async() => {
    const [source, scss] = await Promise.all([
      readFile(POPUP_PATH, 'utf-8'),
      readFile('src/components/popups/md3Player.module.scss', 'utf-8')
    ]);
    // * the class follows the same gate reactively...
    expect(source).toMatch(/'is-swipeable'\]\]: framed\(\) && exterayondSettings\.OEPlayerCoverSwipe/);
    // * ...and the stylesheet scopes pan-y under it, so off = the stock cover
    expect(scss).toMatch(/&\.is-swipeable \{\s*touch-action: pan-y;\s*\}/);
    expect(scss.match(/touch-action:/g)).toHaveLength(1);
  });

  test('the hub row shows for the framed covers only, like the Android editor', async() => {
    const source = await readFile(TAB_PATH, 'utf-8');
    // * Android refreshVisibility: setVisible(swipeRow, framed)
    expect(source).toMatch(/\{framedCover\(\) && \(\s*<Row>[\s\S]*?OEPlayerCoverSwipe[\s\S]*?<\/Row>\s*\)\}/);
  });
});
