import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import I18n from '@lib/langPack';
import {formatDateAccordingToTodayNew, formatFullSentTimeRaw, formatTime} from '@helpers/date';
import formatDuration from '@helpers/formatDuration';
import {setExteralessSetting} from '@stores/exteralessSettings';
import rootScope from '@lib/rootScope';
import commonStateStorage from '@lib/commonStateStorage';
import type {LangPackDifference} from '@layer';
import type {User} from '@layer';
import getUserStatusString from '@components/wrappers/getUserStatusString';
import '@helpers/peerIdPolyfill';

/**
 * The exteraless `showSeconds` setting on message timestamps: off keeps the stock
 * HH:MM byte for byte, on adds seconds, and a flip re-renders what is already on
 * screen — while date separators and durations keep their text.
 */

const pack = {
  _: 'langPackDifference',
  lang_code: 'en',
  from_version: 1,
  version: 1,
  strings: []
} as LangPackDifference;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('message time with seconds', () => {
  const date = new Date(2024, 0, 1, 12, 34, 56);

  beforeAll(async() => {
    vi.spyOn(rootScope, 'dispatchEvent').mockImplementation(() => {});
    vi.spyOn(commonStateStorage, 'get').mockResolvedValue(pack);
    await I18n.getCacheLangPackAndApply();
  });

  beforeEach(async() => {
    document.body.replaceChildren();
    setExteralessSetting('showSeconds', false);
    setExteralessSetting('OERelativeLastSeen', false);
    I18n.setTimeFormat('h23');
    await flush();
  });

  it('off is the stock HH:MM, on adds seconds to an already mounted timestamp', async() => {
    const element = formatTime(date);
    document.body.append(element);
    expect(element.textContent).toBe('12:34');

    setExteralessSetting('showSeconds', true);
    await flush();
    expect(element.textContent).toBe('12:34:56');

    // * new timestamps mount with the setting already applied
    expect(formatTime(date).textContent).toBe('12:34:56');

    setExteralessSetting('showSeconds', false);
    await flush();
    expect(element.textContent).toBe('12:34');
    expect(element.textContent).toBe(formatTime(date).textContent);
  });

  it('keeps the user hour cycle, 12h included', async() => {
    const element = formatTime(date);
    document.body.append(element);
    setExteralessSetting('showSeconds', true);
    I18n.setTimeFormat('h12');
    await flush();
    expect(element.textContent).toBe('12:34:56 PM');

    I18n.setTimeFormat('h23');
    await flush();
    expect(element.textContent).toBe('12:34:56');
  });

  it('updates an already mounted combined date and sent time', async() => {
    const timestamp = date.getTime() / 1000;
    const {dateEl} = formatFullSentTimeRaw(timestamp, {combined: true});
    document.body.append(dateEl);
    const stock = dateEl.textContent;

    setExteralessSetting('showSeconds', true);
    await flush();
    expect(dateEl.textContent).toContain('12:34:56');
    expect(dateEl.textContent).toBe(formatFullSentTimeRaw(timestamp, {combined: true}).dateEl.textContent);

    setExteralessSetting('showSeconds', false);
    await flush();
    expect(dateEl.textContent).toBe(stock);
  });

  it('does not leak seconds into date separators or durations', async() => {
    const separator = formatDateAccordingToTodayNew(new Date());
    const duration = formatDuration(754, 2);
    const {dateEl, timeEl} = formatFullSentTimeRaw(date.getTime() / 1000);
    document.body.append(separator, dateEl, timeEl);

    const separatorText = separator.textContent;
    const dateText = dateEl.textContent;
    const durationText = JSON.stringify(duration);

    setExteralessSetting('showSeconds', true);
    await flush();

    expect(separator.textContent).toBe(separatorText);
    expect(separator.textContent.split(':')).toHaveLength(2);
    expect(dateEl.textContent).toBe(dateText);
    expect(JSON.stringify(duration)).toBe(durationText);
    // * the sent time beside the date is a message time and does carry them
    expect(timeEl.textContent).toBe('12:34:56');
  });

  it('keeps relative hours across midnight and New Year only when enabled', () => {
    vi.useFakeTimers({toFake: ['Date']});
    try {
      const now = new Date(2024, 0, 1, 0, 30).getTime();
      vi.setSystemTime(now);
      const user = {_: 'user', id: 123, pFlags: {}, status: {_: 'userStatusOffline', was_online: now / 1000 - 3600}} as User.user;
      setExteralessSetting('OERelativeLastSeen', false);
      const stock = getUserStatusString(user).textContent;
      expect(stock).not.toContain('hour ago');
      setExteralessSetting('OERelativeLastSeen', true);
      expect(getUserStatusString(user).textContent).toBe('last seen 1 hour ago');
      setExteralessSetting('OERelativeLastSeen', false);
      expect(getUserStatusString(user).textContent).toBe(stock);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses relative hours for less than 24 hours and retains date/time at the boundary', () => {
    vi.useFakeTimers({toFake: ['Date']});
    try {
      const now = new Date(2024, 0, 2, 0, 30).getTime();
      vi.setSystemTime(now);
      setExteralessSetting('OERelativeLastSeen', true);
      const offline = (seconds: number) => getUserStatusString({
        _: 'user', id: 123, pFlags: {}, status: {_: 'userStatusOffline', was_online: now / 1000 - seconds}
      } as User.user).textContent;
      expect(offline(86399)).toBe('last seen 23 hours ago');
      expect(offline(86400)).not.toContain('hours ago');
      expect(offline(-60)).toBe('last seen just now');
    } finally {
      vi.useRealTimers();
      setExteralessSetting('OERelativeLastSeen', false);
    }
  });

  it('does not infer precise activity from private statuses or replace bot and online labels', () => {
    setExteralessSetting('OERelativeLastSeen', true);
    const user = {_: 'user', id: 123, pFlags: {}} as User.user;
    for(const status of ['userStatusRecently', 'userStatusLastWeek', 'userStatusLastMonth', 'userStatusOnline'] as const) {
      user.status = status === 'userStatusOnline' ? {_: status, expires: 0} : {_: status, pFlags: {}};
      const relative = getUserStatusString(user).textContent;
      setExteralessSetting('OERelativeLastSeen', false);
      expect(getUserStatusString(user).textContent).toBe(relative);
      setExteralessSetting('OERelativeLastSeen', true);
    }
    user.pFlags.bot = true;
    expect(getUserStatusString(user).textContent).toBe('bot');
    setExteralessSetting('OERelativeLastSeen', false);
  });
});
