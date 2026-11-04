/*
 * G-3 — the attached sidebar never overlays the chat: the chat's space math
 * (helpers/updateColumnWidths.ts) uses the panel's VISUAL width while the
 * setting is on, so the collapsed sidebar's popped-out panel (an overlay by
 * stock design) pushes the chat instead. Stock math (setting off) reserves
 * the collapsed layout width.
 */
import {describe, test, expect, beforeAll} from 'vitest';

describe('attached sidebar chat space', () => {
  beforeAll(() => {
    // * a collapsed left sidebar preference, read at the helper's import
    localStorage.setItem('sidebar-left-width', '0');
  });

  test('the chat clears the popped-out panel only while attached', async() => {
    const {default: updateColumnWidths, setOpenTabsLeftSidebar} = await import('@helpers/updateColumnWidths');
    const {setExterayondSetting} = await import('@stores/exterayondSettings');

    // * the pop-out state: the layout reserves the collapsed 80, the panel
    // * renders at the default width
    setOpenTabsLeftSidebar(true);
    updateColumnWidths();
    const read = () => document.documentElement.style.getPropertyValue('--chat-width');

    // * stock: the panel overlays the chat — the width ignores it
    expect(read()).toBe('696px');

    // * attached: the chat's space subtracts the panel's visual width
    // * (1024 - 360 - 3 * 16)
    setExterayondSetting('OEAppearanceAttachedSidebar', true);
    updateColumnWidths();
    expect(read()).toBe('616px');

    // * and back
    setExterayondSetting('OEAppearanceAttachedSidebar', false);
    updateColumnWidths();
    expect(read()).toBe('696px');
  });
});
