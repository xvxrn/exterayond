import {appSettings, setAppSettings} from '@stores/appSettings';
import {resetExteralessSettings} from '@stores/exteralessSettings';

/** Android NaConfig.HideArchive (false) is the inverse of Web K's existing setting. */
export const isArchiveHidden = () => appSettings.showArchiveInChatList === false;

// No second persisted key: context-menu changes and the preferences hub share this value.
export const setArchiveHidden = (hidden: boolean) => setAppSettings('showArchiveInChatList', !hidden);

/** The hub resets its own record and the one native preference it exposes. */
export const resetExteralessPreferences = () => {
  resetExteralessSettings();
  // Also safe before app settings have been loaded.
  if(isArchiveHidden()) void setArchiveHidden(false);
};
