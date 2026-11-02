/**
 * exteraless showResultsBeforeVoting (CHAT-26) — the gate's truth table,
 * Android `ChatMessageCell.isPollResultsPreviewEnabled()` (1473-1491): results
 * preview before voting needs results on the message, never shows for a
 * closed poll, and `hide_results_until_close` hides them from everyone except
 * the poll's creator.
 */

import {describe, expect, it} from 'vitest';
import {isPollResultsPreviewEnabled} from '@components/chat/bubbleParts/pollMessageContent/usePollDerivedProps';

const RESULTS = {total_voters: 3, results: [{}]};
const NO_VOTERS = {total_voters: 0, results: [{}]};
const NO_RESULTS = {total_voters: 3};

describe('pollResultsPreview (CHAT-26, ChatMessageCell.isPollResultsPreviewEnabled)', () => {
  it('shows results of an open poll with tallied results while the setting is on', () => {
    expect(isPollResultsPreviewEnabled(true, false, false, false, RESULTS)).toBe(true);
  });

  it('the setting gates the whole behavior (off = stock: no preview)', () => {
    expect(isPollResultsPreviewEnabled(false, false, false, false, RESULTS)).toBe(false);
  });

  it('needs results with at least one voter', () => {
    expect(isPollResultsPreviewEnabled(true, false, false, false, NO_VOTERS)).toBe(false);
    expect(isPollResultsPreviewEnabled(true, false, false, false, NO_RESULTS)).toBe(false);
    expect(isPollResultsPreviewEnabled(true, false, false, false, undefined)).toBe(false);
  });

  it('a closed poll never previews, even for its creator', () => {
    expect(isPollResultsPreviewEnabled(true, true, false, false, RESULTS)).toBe(false);
    expect(isPollResultsPreviewEnabled(true, true, false, true, RESULTS)).toBe(false);
  });

  it('hide_results_until_close hides the preview from everyone except the creator', () => {
    expect(isPollResultsPreviewEnabled(true, false, true, false, RESULTS)).toBe(false);
    expect(isPollResultsPreviewEnabled(true, false, true, true, RESULTS)).toBe(true);
  });
});
