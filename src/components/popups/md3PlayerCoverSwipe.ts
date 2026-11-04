/**
 * The pointer mechanics of Android `PlayerSheet.onCoverTouch` plus the
 * release decision of `finishCoverDrag` (PLAYER-06, `OEPlayerCoverSwipe`),
 * extracted as a testable factory over the popup's cover box — the CHAT-26
 * predicate treatment. The constants are Android's dp at the web's 1dp = 1px
 * scale; the consumer renders the drag and animates the release.
 */

/** Android's touch slop: the horizontal intent that arms the drag. */
export const COVER_DRAG_SLOP = 8;
/** The non-disc cover's rotation divisor. */
export const COVER_DRAG_ROTATE = 40;
/** The drag's alpha fade distance. */
export const COVER_DRAG_FADE = 420;
/** Android's release threshold: past dp(70) the track switches. */
export const COVER_DRAG_SWITCH = 70;

export type CoverSwipeRelease = {
  /** `false` springs the cover back, `true` switches the track. */
  switch: boolean;
  /** The direction past the threshold: a drag to the left is next. */
  next: boolean;
};

/** Android `finishCoverDrag`: under dp(70) spring back, else the direction. */
export const coverSwipeRelease = (dx: number): CoverSwipeRelease => ({
  switch: Math.abs(dx) >= COVER_DRAG_SWITCH,
  next: dx < 0
});

/** Android `setCoverDrag`: translate, rotate the non-disc covers, fade. */
export const coverSwipeDragVisual = (dx: number, disc: boolean) => ({
  transform: `translateX(${dx}px)` + (disc ? '' : ` rotate(${dx / COVER_DRAG_ROTATE}deg)`),
  opacity: String(1 - Math.min(Math.abs(dx) / COVER_DRAG_FADE, 0.4))
});

export type CoverSwipeCallbacks = {
  /** The per-down gate: the store key plus the card/disc cover styles. */
  allowed: () => boolean;
  /** Android's setCoverDrag while the drag is armed. */
  onDrag: (dx: number) => void;
  /** Android's finishCoverDrag at release; a cancelled pointer springs back. */
  onFinish: (dx: number) => void;
};

/**
 * Attaches the horizontal drag to the cover box. The move/up/cancel
 * listeners ride the element, so a removed cover drops them with it; the
 * gate is read at every pointerdown, so the toggle applies live.
 */
export const attachCoverSwipe = (element: HTMLElement, callbacks: CoverSwipeCallbacks) => {
  element.addEventListener('pointerdown', (event: PointerEvent) => {
    if(!callbacks.allowed()) return;
    const pointerId = event.pointerId;
    let startX = event.clientX;
    let startY = event.clientY;
    let dx = 0;
    let armed = false;
    const stopTracking = () => {
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerCancel);
    };
    const onPointerMove = (moveEvent: PointerEvent) => {
      if(moveEvent.pointerId !== pointerId) return;
      const nextDx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if(!armed) {
        if(Math.abs(nextDx) > COVER_DRAG_SLOP && Math.abs(nextDx) > Math.abs(dy) * 1.2) {
          armed = true;
          // * Android resets the drag origin at activation, so the count
          // * starts from the armed point
          startX = moveEvent.clientX;
          startY = moveEvent.clientY;
          dx = 0;
          element.setPointerCapture(pointerId);
        } else if(Math.abs(dy) > COVER_DRAG_SLOP) {
          // * a vertical intent abandons the drag entirely
          stopTracking();
          return;
        } else {
          return;
        }
      }
      dx = moveEvent.clientX - startX;
      callbacks.onDrag(dx);
    };
    const onPointerUp = (upEvent: PointerEvent) => {
      if(upEvent.pointerId !== pointerId) return;
      stopTracking();
      callbacks.onFinish(dx);
    };
    const onPointerCancel = () => {
      stopTracking();
      // * Android's ACTION_CANCEL springs the cover back
      callbacks.onFinish(0);
    };
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerCancel);
  });
};
