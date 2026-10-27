import type {Message} from '@layer';
import {ChatType} from '@components/chat/chatType';
import showTooltip from '@components/tooltip';
import I18n, {i18n, LangPackKey} from '@lib/langPack';
import {exteralessSettings} from '@stores/exteralessSettings';
import appNavigationController, {NavigationItem} from '@components/appNavigationController';
import tooltipController from '@helpers/tooltipController';

export function canShowMessageTimeHint(message: Message.message | Message.messageService, chatType: ChatType) {
  return exteralessSettings.ShowTimeHint &&
    !(message as Message.message).fwd_from?.pFlags?.imported &&
    [ChatType.Chat, ChatType.Discussion, ChatType.Pinned, ChatType.Saved, ChatType.Search].includes(chatType);
}

/** Created on click only; no subscriptions, requests or tooltip nodes per message. */
export function showMessageTimeHint(message: Message.message | Message.messageService, chatType: ChatType, element: HTMLElement, container: HTMLElement) {
  if(!canShowMessageTimeHint(message, chatType)) return false;
  const text = document.createDocumentFragment();
  const append = (key: LangPackKey, timestamp: number) => {
    if(!timestamp) return;
    const row = document.createElement('div');
    row.dir = 'auto';
    const date = new I18n.IntlDateElement({
      date: new Date(timestamp * 1000),
      options: {year: 'numeric', month: 'short', day: 'numeric', ...I18n.getMessageTimeOptions(), second: '2-digit'}
    }).element;
    row.append(i18n(key, [date]));
    text.append(row);
  };
  append('Exteraless.TimeHint.Sent', message.date);
  if(message._ === 'message') {
    if(!message.pFlags.edit_hide) append('Exteraless.TimeHint.Edited', message.edit_date);
    append('Exteraless.TimeHint.Forwarded', message.fwd_from?.date);
  }
  tooltipController.closeAll();
  const {close} = showTooltip({
    element, container, vertical: 'top', textElement: text, auto: true, useOverlay: false,
    onClose: () => appNavigationController.removeItem(navigation)
  });
  const navigation: NavigationItem = {
    type: 'toast', noHistory: true, noBlurOnPop: true, onPop: () => close()
  };
  appNavigationController.pushItem(navigation);
  return true;
}
