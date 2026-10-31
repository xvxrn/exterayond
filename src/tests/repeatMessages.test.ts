import {describe, expect, test, vi, beforeEach} from 'vitest';

/**
 * CHAT-35 — the "Repeat" action (Android NekoConfig.showRepeat) and
 * NekoConfig.repeatConfirm's gate: a confirmation dialog before the messages
 * are forwarded straight back into the same chat (ChatActivity.repeatMessage
 * → doRepeatMessage), cancellation cancels the forward.
 */

const confirmationMock = vi.hoisted(() => vi.fn());
vi.mock('@components/confirmationPopup', () => ({default: confirmationMock}));

import repeatMessages from '@components/chat/repeatMessages';
import {setExteralessSetting} from '@stores/exteralessSettings';

const makeManagers = () => {
  const forwardMessages = vi.fn(async() => undefined);
  return {managers: {appMessagesManager: {forwardMessages}} as any, forwardMessages};
};

describe('repeatMessages', () => {
  beforeEach(() => {
    confirmationMock.mockReset();
    confirmationMock.mockResolvedValue(undefined);
    setExteralessSetting('repeatConfirm', true);
    setExteralessSetting('showRepeat', false);
  });

  test('asks and forwards into the same chat while the confirmation is on', async() => {
    const {managers, forwardMessages} = makeManagers();
    await expect(repeatMessages(managers, 100 as PeerId, [21, 22])).resolves.toBe(true);
    expect(confirmationMock).toHaveBeenCalledTimes(1);
    expect(forwardMessages).toHaveBeenCalledWith({peerId: 100, fromPeerId: 100, mids: [21, 22]});
  });

  test('cancelling the dialog cancels the forward', async() => {
    const {managers, forwardMessages} = makeManagers();
    confirmationMock.mockRejectedValue('canceled');
    await expect(repeatMessages(managers, 100 as PeerId, [21])).resolves.toBe(false);
    expect(forwardMessages).not.toHaveBeenCalled();
  });

  test('the default confirmation-off sends without asking', async() => {
    setExteralessSetting('repeatConfirm', false);
    const {managers, forwardMessages} = makeManagers();
    await expect(repeatMessages(managers, 100 as PeerId, [21])).resolves.toBe(true);
    expect(confirmationMock).not.toHaveBeenCalled();
    expect(forwardMessages).toHaveBeenCalledTimes(1);
  });

  test('nothing to repeat forwards nothing', async() => {
    const {managers, forwardMessages} = makeManagers();
    await expect(repeatMessages(managers, 100 as PeerId, [])).resolves.toBe(false);
    expect(confirmationMock).not.toHaveBeenCalled();
    expect(forwardMessages).not.toHaveBeenCalled();
  });
});
