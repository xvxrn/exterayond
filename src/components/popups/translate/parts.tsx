import {ButtonIconTsx} from '@components/buttonIconTsx';
import {InstantViewBlocks} from '@components/instantView';
import {instantViewStyles} from '@components/instantViewFormatting';
import {previewStyles} from '@components/popups/previewCard';
import Scrollable, {ScrollableContextValue} from '@components/scrollable2';
import {Skeleton} from '@components/skeleton';
import {toastNew} from '@components/toast';
import {copyTextToClipboard} from '@helpers/clipboard';
import prepareTextWithEntitiesForCopying from '@helpers/prepareTextWithEntitiesForCopying';
import createMiddleware from '@helpers/solid/createMiddleware';
import {I18nTsx} from '@helpers/solid/i18n';
import {requestRAF} from '@helpers/solid/requestRAF';
import classNames from '@helpers/string/classNames';
import {Message, RichMessage, TextWithEntities} from '@layer';
import {buildTranslatedDisplayText, shouldKeepOriginalForManualTranslation} from '@lib/exterayondTranslate';
import {flattenRichMessageContent, richMessageToPage} from '@lib/richMessage';
import {exterayondSettings} from '@stores/exterayondSettings';
import {useHotReloadGuard} from '@lib/solidjs/hotReloadGuard';
import SolidJSHotReloadGuardProvider, {hotReloadGuard} from '@lib/solidjs/hotReloadGuardProvider';
import {createEffect, createResource, createSignal, JSX, Match, Switch} from 'solid-js';
import {Transition} from 'solid-transition-group';
import {bindManagersToSession} from '@lib/accounts/bindManagersToAccount';

type TranslationResult =
  {type: 'text', value: TextWithEntities} |
  {type: 'rich', value: RichMessage};

const ResultSkeleton = (props: {height?: number}) => {
  return (
    <Skeleton.Div
      class={previewStyles.resultSkeleton}
      secondary
      style={props.height ? {height: props.height + 'px'} : undefined}
    />
  );
};

export const Result = (props: {
  title: JSX.Element;
  /** Reactive target language; refetches the translation when it changes */
  language: TranslatableLanguageISO;
  message?: Message.message;
  textWithEntities?: TextWithEntities;
  /**
   * The original side the popup shows (the rich-message-aware computation
   * from the body) — TRANS-05's keep-original copy reads its text.
   */
  originalTextWithEntities?: TextWithEntities;
  wireCaptionClick?: (div: HTMLElement) => void;
}) => {
  const {rootScope, wrapRichText} = useHotReloadGuard();

  const [translation] = createResource<TranslationResult, TranslatableLanguageISO>(
    () => props.language,
    async(lang) => {
      const managers = bindManagersToSession(rootScope.managers);
      if(props.message?.rich_message) {
        return {
          type: 'rich',
          value: await managers.appTranslationsManager.translateRichMessage({
            peerId: props.message.peerId,
            mid: props.message.mid,
            lang
          })
        };
      }

      return {
        type: 'text',
        value: await managers.appTranslationsManager.translateText({
          ...(props.message ? {peerId: props.message.peerId, mid: props.message.mid} : {text: props.textWithEntities}),
          lang
        })
      };
    }
  );

  let scrollableRef: HTMLDivElement, scrollableContextRef: ScrollableContextValue;
  const [skeletonHeight, setSkeletonHeight] = createSignal<number>();

  // Remember the rendered height so the skeleton keeps the size of the previous result
  // while re-translating (e.g. after switching the language)
  createEffect(() => {
    if(translation.state !== 'ready' && scrollableRef?.isConnected) {
      setSkeletonHeight(scrollableRef.clientHeight);
    }
  });

  const onCopyClick = async() => {
    if(translation.state !== 'ready') return;
    const translated = translation();
    if(!translated?.value) return;
    const textWithEntities = translated.type === 'rich' ?
      flattenRichMessageContent(translated.value) :
      translated.value;
    const {text, html} = prepareTextWithEntitiesForCopying(textWithEntities);

    // * TRANS-05 (`NaConfig.translatorMode`): under "Manual Only"/"On" the
    // * manual takeaway carries the original — Android's `startTrans` alert
    // * shows `buildTranslatedDisplayText(original, translation,
    // * shouldKeepOriginalForManualTranslation(mode))` and the inline
    // * pipeline renders the same join into the message; the popup's copy is
    // * the web's single manual-translation takeaway (GEN-01: the popup is
    // * the sheet analog, its cards always show both sides like the sheet).
    // * Off copies the translation alone — the stock behavior.
    if(shouldKeepOriginalForManualTranslation(exterayondSettings.translatorMode) && props.originalTextWithEntities?.text) {
      const joined = buildTranslatedDisplayText(props.originalTextWithEntities.text, text, true);
      try {
        await copyTextToClipboard(joined, undefined, {rethrow: true});
        toastNew({langPackKey: 'TextCopied'});
      } catch{
        toastNew({langPackKey: 'TextCopyFailed'});
      }
      return;
    }

    try {
      await copyTextToClipboard(text, html, {rethrow: true});
      toastNew({langPackKey: 'TextCopied'});
    } catch{
      toastNew({langPackKey: 'TextCopyFailed'});
    }
  };

  return (
    <>
      <div class={previewStyles.resultHeader}>
        <div class={previewStyles.resultTitleWrapper}>
          {props.title}
          <ButtonIconTsx
            class={previewStyles.copyButton}
            classList={{
              [previewStyles.hidden]: translation.state !== 'ready'
            }}
            icon='copy'
            onClick={onCopyClick}
          />
        </div>
      </div>
      <div class={previewStyles.resultContent}>
        <Transition
          name='fade-2'
          mode='outin'
          onAfterEnter={(el) => {
            if(el === scrollableRef) requestRAF(() => {
              scrollableContextRef?.onSizeChange?.();
            });
          }}>
          <Switch>
            <Match when={translation.state === 'ready' && translation()} keyed>
              {(translated) => (
                <Scrollable
                  tabIndex={0}
                  ref={scrollableRef}
                  contextRef={(value) => void (scrollableContextRef = value)}
                  relative
                  class={previewStyles.richTextScrollable}
                  withBorders='manual'
                >
                  <div
                    class={classNames(previewStyles.richTextScrollableContent, 'spoilers-container')}
                    dir='auto'
                    ref={(el) => props.wireCaptionClick?.(el)}
                  >
                    {translated.type === 'rich' ? (
                      <InstantViewBlocks
                        webPageId={props.message.mid}
                        page={richMessageToPage(translated.value)}
                        openNewPage={(page) => {
                          hotReloadGuard.openInstantViewInAppBrowser({
                            cachedPage: page,
                            HotReloadGuardProvider: SolidJSHotReloadGuardProvider
                          });
                        }}
                        collapse={() => {}}
                        class={instantViewStyles.RichMessage}
                        paddings={0}
                      />
                    ) : wrapRichText(translated.value.text, {
                      textColor: 'primary-text-color',
                      middleware: createMiddleware().get(),
                      entities: translated.value.entities
                    })}
                  </div>
                </Scrollable>
              )}
            </Match>
            <Match when={translation.state === 'pending' || translation.state === 'refreshing'}>
              <ResultSkeleton height={skeletonHeight()} />
            </Match>
            <Match when>
              <div class={previewStyles.error}>
                <I18nTsx key='Translate.Error' />
              </div>
            </Match>
          </Switch>
        </Transition>
      </div>
    </>
  );
};
