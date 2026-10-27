import Row from '@components/rowTsx';
import Section from '@components/section';
import {i18n} from '@lib/langPack';
import {useSuperTab} from '@components/solidJsTabs/superTabProvider';
import {hotReloadGuard} from '@lib/solidjs/hotReloadGuardProvider';

/**
 * The exteraless Preferences hub root, ported from Android's
 * `OpenExteraSettingsActivity`: an about header, the category rows
 * (General / Appearance / Chats / Plugins / Other), links and design credits.
 * Categories without a ported slice yet render as rows marked "Not ported
 * yet" — they are never faked as working.
 */
const Exteraless = () => {
  const [tab] = useSuperTab();

  const openLink = (url: string) => () => {
    hotReloadGuard.appImManager.openUrl(url, true);
  };

  return (
    <>
      <Section>
        <div class="exteraless-about">
          <div class="exteraless-about-name">exterayond</div>
          <div class="exteraless-about-tagline">{i18n('Exteraless.Info')}</div>
        </div>
      </Section>
      <Section name="Exteraless.Categories">
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExteralessGeneralTab).open()}>
          <Row.Icon icon="general_filled" />
          <Row.Title>{i18n('Exteraless.General')}</Row.Title>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExteralessAppearanceTab).open()}>
          <Row.Icon icon="appearance_filled" />
          <Row.Title>{i18n('Exteraless.Appearance')}</Row.Title>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExteralessChatsTab).open()}>
          <Row.Icon icon="message_filled" />
          <Row.Title>{i18n('Exteraless.Chats')}</Row.Title>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExteralessPluginsTab).open()}>
          <Row.Icon icon="bots" />
          <Row.Title>{i18n('Exteraless.Plugins')}</Row.Title>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExteralessOtherTab).open()}>
          <Row.Icon icon="more" />
          <Row.Title>{i18n('Exteraless.Other')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exteraless.Links">
        <Row clickable={openLink('https://t.me/exterayond')}>
          <Row.Icon icon="channel_filled" />
          <Row.Title titleRight="@exterayond" titleRightSecondary>{i18n('Exteraless.Channel')}</Row.Title>
        </Row>
        <Row clickable={openLink('https://github.com/exteraless/exteraless')}>
          <Row.Icon icon="link" />
          <Row.Title titleRight="GitHub" titleRightSecondary>{i18n('Exteraless.Source')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exteraless.Design">
        <Row clickable={openLink('https://t.me/the8055u')}>
          <Row.Icon icon="brush" />
          <Row.Title titleRight="@the8055u" titleRightSecondary>{i18n('Exteraless.Designer')}</Row.Title>
        </Row>
        <Row clickable={openLink('https://t.me/BlueprintDsgn')}>
          <Row.Icon icon="group_filled" />
          <Row.Title titleRight="@BlueprintDsgn" titleRightSecondary>{i18n('Exteraless.DesignStudio')}</Row.Title>
        </Row>
      </Section>
    </>
  );
};

export default Exteraless;
