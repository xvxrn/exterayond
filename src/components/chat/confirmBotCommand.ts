import confirmationPopup from '@components/confirmationPopup';
import {exterayondSettings} from '@stores/exterayondSettings';
import {getCurrentAccount} from '@lib/accounts/getCurrentAccount';

/** Command links, menu and autocomplete share this; off keeps the synchronous path. */
export default function confirmBotCommand(command: string): MaybePromise<boolean> {
  if(!exterayondSettings.DisableClickCommandToSend) return true;
  return confirmationPopup({
    accountNumber: getCurrentAccount(),
    titleLangKey: 'Exterayond.ConfirmBotCommand.Title',
    descriptionLangKey: 'Exterayond.ConfirmBotCommand.Text',
    descriptionLangArgs: [command],
    button: {langKey: 'Send'}
  }).then(() => true, () => false);
}
