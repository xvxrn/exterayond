import confirmationPopup from '@components/confirmationPopup';
import {exterayondSettings} from '@stores/exterayondSettings';
import {AppManagers} from '@lib/managers';

/**
 * CHAT-35 — the "Repeat" action behind Android NekoConfig.showRepeat, and
 * NekoConfig.repeatConfirm's confirmation gate before it
 * (ChatActivity.repeatMessage → doRepeatMessage): the messages are forwarded
 * straight back into the same chat — no forward picker. The chat's own
 * noforwards state is checked by the menu item's verify, so the plain
 * forward covers the reachable cases. Returns whether the forward was sent.
 */
export default async function repeatMessages(managers: AppManagers, peerId: PeerId, mids: number[]): Promise<boolean> {
  if(!mids.length) {
    return false;
  }

  if(exterayondSettings.repeatConfirm) {
    try {
      await confirmationPopup({
        titleLangKey: 'Exterayond.Repeat.Title',
        descriptionLangKey: 'Exterayond.Repeat.Text',
        button: {langKey: 'OK'}
      });
    } catch(e) {
      return false;
    }
  }

  await managers.appMessagesManager.forwardMessages({peerId, fromPeerId: peerId, mids});
  return true;
}
