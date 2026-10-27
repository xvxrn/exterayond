import confirmationPopup from '@components/confirmationPopup';
import {exteralessSettings} from '@stores/exteralessSettings';
import {getCurrentAccount} from '@lib/accounts/getCurrentAccount';

/** Command links, menu and autocomplete share this; off keeps the synchronous path. */
export default function confirmBotCommand(command: string): MaybePromise<boolean> {
  if(!exteralessSettings.DisableClickCommandToSend) return true;
  return confirmationPopup({
    accountNumber: getCurrentAccount(),
    titleLangKey: 'Exteraless.ConfirmBotCommand.Title',
    descriptionLangKey: 'Exteraless.ConfirmBotCommand.Text',
    descriptionLangArgs: [command],
    button: {langKey: 'Send'}
  }).then(() => true, () => false);
}
