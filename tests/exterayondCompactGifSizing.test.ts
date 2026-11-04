/**
 * MEDIA-10 (`ShowSmallGIF`): the sizing contract behind the compact GIFs.
 * The standalone chat media path (bubbles.ts `messageMediaDocument`) calls
 * `gifMediaBox` and forwards the result into `wrapVideo` → `wrapPhoto` →
 * `setAttachmentSize` — these tests pin the end of that chain: with
 * `noMinSize`, BOTH sizing paths the compact GIF takes (the `image/gif`
 * branch's explicit full-document photoSize, and the mp4 poster's
 * thumbs-chosen size — most Telegram GIFs are mp4 documents) keep the
 * compact box, while the stock path (no flag) still applies every expansion
 * for everything else. The grouped-album path never reaches `gifMediaBox`
 * (the call sits in the single-media branch of `messageMediaDocument`, after
 * the album check) — audited in the packet, not re-rendered here.
 */
import setAttachmentSize from '@helpers/setAttachmentSize';
import {OE_COMPACT_GIF_SIZE} from '@stores/exterayondSettings';

const BOX = OE_COMPACT_GIF_SIZE;

// * a wide GIF document as Telegram carries it: full dimensions on the doc,
// * thumbs of 100 and 320 (the poster size the mp4 path chooses from)
const gifDoc = (mime: string) => ({
  _: 'document',
  id: '1',
  type: 'gif',
  w: 640,
  h: 360,
  mime_type: mime,
  size: 123456,
  thumbs: [
    {_: 'photoSizeProgressive', w: 100, h: 100, type: 'm'},
    {_: 'photoSize', w: 320, h: 320, type: 'x'}
  ]
});

// * the synthetic full-document photoSize wrapPhoto builds for image/gif
const fullDocPhotoSize = (doc: {w: number, h: number, size: number}) => ({
  _: 'photoSize',
  w: doc.w,
  h: doc.h,
  size: doc.size,
  type: ''
});

const captionMessage = {_: 'message', message: 'a caption'} as any;

describe('the compact GIF sizing (MEDIA-10, setAttachmentSize noMinSize)', () => {
  test('the mp4 poster path keeps the compact box: no 200px min-side, no 320px text width', () => {
    const element = document.createElement('div');
    setAttachmentSize({
      photo: gifDoc('video/mp4') as any,
      element,
      boxWidth: BOX,
      boxHeight: BOX,
      message: captionMessage,
      noMinSize: true
    });

    // * the wide GIF fits inside the compact box keeping its aspect
    expect(element.style.width).toBe(BOX + 'px');
    expect(parseInt(element.style.height)).toBeLessThanOrEqual(BOX);
    expect(parseInt(element.style.height)).toBeGreaterThan(0);
  });

  test('the image/gif path (explicit full-document photoSize) keeps the compact box too', () => {
    const doc = gifDoc('image/gif');
    const element = document.createElement('div');
    setAttachmentSize({
      photo: doc as any,
      element,
      boxWidth: BOX,
      boxHeight: BOX,
      photoSize: fullDocPhotoSize(doc) as any,
      message: captionMessage,
      noMinSize: true
    });

    expect(element.style.width).toBe(BOX + 'px');
    expect(parseInt(element.style.height)).toBeLessThanOrEqual(BOX);
  });

  test('the stock path (no flag) still expands: 200px min side and the 320px text width', () => {
    // * without a caption: the min-side expansion carries the media to 200px
    const bare = document.createElement('div');
    setAttachmentSize({
      photo: gifDoc('video/mp4') as any,
      element: bare,
      boxWidth: BOX,
      boxHeight: BOX
    });
    expect(parseInt(bare.style.width)).toBe(200);

    // * with a caption: the text-width expansion widens the block to 320px
    const withCaption = document.createElement('div');
    setAttachmentSize({
      photo: gifDoc('video/mp4') as any,
      element: withCaption,
      boxWidth: BOX,
      boxHeight: BOX,
      message: captionMessage
    });
    expect(parseInt(withCaption.style.width)).toBe(320);
  });

  test('the stock video minimum (368px) is intact, and the flag skips it only when asked', () => {
    const videoDoc = {
      ...gifDoc('video/mp4'),
      type: 'video',
      duration: 12
    };

    // * stock: a video with a player and a caption widens to MIN_VIDEO_SIDE_SIZE
    const stock = document.createElement('div');
    setAttachmentSize({
      photo: videoDoc as any,
      element: stock,
      boxWidth: BOX,
      boxHeight: BOX,
      message: captionMessage,
      canHaveVideoPlayer: true
    });
    expect(parseInt(stock.style.width)).toBe(368);

    // * the flag skips it — but no caller passes it for videos (the store
    //   compacts GIF documents only); this pins the helper's contract
    const skipped = document.createElement('div');
    setAttachmentSize({
      photo: videoDoc as any,
      element: skipped,
      boxWidth: BOX,
      boxHeight: BOX,
      message: captionMessage,
      canHaveVideoPlayer: true,
      noMinSize: true
    });
    expect(skipped.style.width).toBe(BOX + 'px');
  });

  test('a GIF smaller than the compact box stays at its natural size (the web never zooms up)', () => {
    const element = document.createElement('div');
    setAttachmentSize({
      photo: {
        ...gifDoc('video/mp4'),
        w: 80,
        h: 45,
        thumbs: [{_: 'photoSize', w: 80, h: 45, type: 'm'}]
      } as any,
      element,
      boxWidth: BOX,
      boxHeight: BOX,
      noMinSize: true
    });

    expect(element.style.width).toBe('80px');
    expect(element.style.height).toBe('45px');
  });
});
