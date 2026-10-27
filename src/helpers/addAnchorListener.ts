import wrapUrl from '@lib/richTextProcessor/wrapUrl';
import matchTelegramUrlHost from '@lib/richTextProcessor/matchTelegramUrlHost';
import cancelEvent from '@helpers/dom/cancelEvent';
import parseUriParams from '@helpers/string/parseUriParams';
import {exteralessSettings} from '@stores/exteralessSettings';

const LOCAL_ACTIONS = new Set(['showMaskedAlert', 'execBotCommand', 'searchByHashtag', 'setMediaTimestamp']);

// * https://core.telegram.org/api/links

type InternalLinkAnchorType =
  | 'showMaskedAlert'
  | 'execBotCommand'
  | 'searchByHashtag'
  | 'addstickers'
  | 'im'
  | 'resolve'
  | 'privatepost'
  | 'voicechat'
  | 'call'
  | 'joinchat'
  | 'join'
  | 'invoice'
  | 'addemoji'
  | 'setMediaTimestamp'
  | 'addlist'
  | 'boost'
  | 'premium_offer'
  | 'giftcode'
  | 'm'
  | 'message'
  | 'stars_topup'
  | 'share'
  | 'msg_url'
  | 'nft'
  | 'iv'
  | 'new'
  | 'settings'
  | 'contacts'
  | 'chats'
  | 'addstyle'
;

export const UNSAFE_ANCHOR_LINK_TYPES: Set<InternalLinkAnchorType> = new Set([
  'showMaskedAlert',
  'execBotCommand'
]);

export default function addAnchorListener<
  Params extends {
    pathnameParams?: any,
    uriParams?: any
  }
>(options: {
  name: InternalLinkAnchorType,
  protocol?: 'tg',
  callback: (params: Params & {element?: HTMLAnchorElement, href: string, masked?: boolean, event?: Event, onConfirmed?: (anchor: HTMLAnchorElement) => any}) => any,
  noPathnameParams?: boolean,
  noUriParams?: boolean,
  noCancelEvent?: boolean
}) {
  (window as any)[(options.protocol ? options.protocol + '_' : '') + options.name] = (element?: HTMLAnchorElement, e?: Event, onConfirmed?: (anchor: HTMLAnchorElement) => any) => {
    !options.noCancelEvent && cancelEvent(null);

    let href = element.href;
    if(!href) {
      return;
    }

    let pathnameParams: any[];
    let uriParams: any;

    const u = new URL(href);
    const match = matchTelegramUrlHost(u);
    if(match?.prefix) {
      u.pathname = match.prefix + (u.pathname === '/' ? '' : u.pathname);
      href = u.toString();
    }

    if(!options.noPathnameParams) pathnameParams = new URL(href).pathname.split('/').slice(1);
    if(!options.noUriParams) uriParams = parseUriParams(href);

    let displayedUrl: string;
    try {displayedUrl = new URL(wrapUrl(element.textContent).url).href;} catch{}
    const masked = element.href !== displayedUrl && element.getAttribute('safe') === null;
    const event = e || window.event;
    const execute = () => options.callback({
      ...{pathnameParams, uriParams} as Params,
      element,
      href,
      masked,
      event,
      onConfirmed
    });

    if(exteralessSettings.ConfirmAllLinks && !LOCAL_ACTIONS.has(options.name) && (window as any).showMaskedAlert) {
      return (window as any).showMaskedAlert(element, e, execute);
    }

    const result = execute();

    if(!e?.isTrusted) {
      return result;
    }
  };
}

const MIDDLE_BUTTON = 1;

/** The handler's name, spelled by either carrier: an inline `onclick`, or a web-page box's dataset. */
function getAnchorCallbackName(anchor: HTMLAnchorElement) {
  const fromDataset = anchor.dataset.callback;
  if(fromDataset) {
    return fromDataset;
  }

  const onclick = anchor.getAttribute('onclick'); // `showMaskedAlert(this)`
  const index = onclick ? onclick.indexOf('(') : -1;
  return index > 0 ? onclick.slice(0, index) : undefined;
}

/**
 * A masked link asks before it opens, and that question hangs off the anchor's `onclick` — which
 * the browser fires for the primary button alone. A middle click went around it and opened the
 * real host in a new tab, i.e. exactly the navigation the alert is there to hold back, so it is
 * answered with the same alert. The remaining ways past it (the native context menu, dragging
 * the link out) belong to the browser and cannot be taken back from it.
 */
function onMaskedAnchorAuxClick(e: MouseEvent) {
  if(e.button !== MIDDLE_BUTTON || e.defaultPrevented) {
    return false;
  }

  // the innermost anchor, not the innermost MASKED one: a plain link nested in a masked web-page
  // box carries its own destination, and the box's alert would name a url nobody clicked
  const anchor = (e.target as Element)?.closest?.('a');
  if(!anchor?.href) {
    return false;
  }

  const callback = getAnchorCallbackName(anchor);
  const masked = callback === 'showMaskedAlert';
  if(!masked && (!exteralessSettings.ConfirmAllLinks || LOCAL_ACTIONS.has(callback))) return false;
  if(anchor.hasAttribute('download') || /^(blob:|data:)/i.test(anchor.href)) return false;
  if(anchor.getAttribute('href')?.startsWith('#') || anchor.closest('[contenteditable="true"]')) return false;

  const showMaskedAlert = (window as any).showMaskedAlert;
  if(!showMaskedAlert) {
    return false;
  }

  cancelEvent(e);
  showMaskedAlert(anchor, e, masked ? undefined : (approved: HTMLAnchorElement) => {
    approved.target = '_blank';
    approved.rel = 'noopener noreferrer';
    approved.click();
  });
  return true;
}

/** The app's existing document click owner supplies its auth/sponsored processing after consent. */
export function confirmExternalAnchorClick(event: Event, anchor: HTMLAnchorElement, onConfirmed: (anchor: HTMLAnchorElement) => void) {
  if(!exteralessSettings.ConfirmAllLinks || event.defaultPrevented || !anchor?.href ||
    anchor.onclick || getAnchorCallbackName(anchor) || anchor.hasAttribute('download') ||
    anchor.getAttribute('href')?.startsWith('#') || anchor.closest('[contenteditable="true"]') ||
    !/^(https?:|mailto:|tel:)/i.test(anchor.href)) return false;
  const showMaskedAlert = (window as any).showMaskedAlert;
  if(!showMaskedAlert) return false;
  cancelEvent(event);
  showMaskedAlert(anchor, event, onConfirmed);
  return true;
}

let listeningForMaskedAnchorAuxClicks = false;
export function listenForMaskedAnchorAuxClicks() {
  if(listeningForMaskedAnchorAuxClicks) {
    return;
  }

  listeningForMaskedAnchorAuxClicks = true;
  // bubble phase on purpose: a capture-phase guard closer to the content (hidden links inside
  // bubbles, the read-only preview chat) gets to swallow the click before this one sees it
  document.addEventListener('auxclick', onMaskedAnchorAuxClick);
}
