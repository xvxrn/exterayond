import PreloaderRing from '@components/preloaderRing';
import ProgressivePreloader from '@components/preloader';
import {setExteralessSetting} from '@stores/exteralessSettings';

vi.mock('@helpers/liteMode', () => ({default: {
  isAvailable: () => false,
  getAnimationLevel: () => 0
}}));

afterEach(() => {
  setExteralessSetting('OEAppearanceNewLoadingStyle', true);
  document.body.replaceChildren();
});

test('MD3 downloads retain byte progress across a reset and a style change', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const ring = new PreloaderRing(container);
  ring.onAttach();
  ring.setTarget(.5);
  const legacy = container.querySelector<SVGCircleElement>('.preloader-line');
  const md3 = container.querySelector<SVGPathElement>('.preloader-md3-wave');
  expect(md3.getAttribute('stroke-dasharray')).toBe(legacy.getAttribute('stroke-dasharray'));
  expect(md3.getAttribute('opacity')).toBe('1');
  ring.setManual(true, false);
  ring.setTarget(0);
  expect(md3.getAttribute('opacity')).toBe('0');
  ring.setManual(false, false);
  setExteralessSetting('OEAppearanceNewLoadingStyle', false);
  ring.setTarget(.75);
  expect(parseFloat(legacy.getAttribute('stroke-dasharray'))).toBeCloseTo(89.54, 1);
  container.remove();
  ring.sweep();
});

test('streaming progress updates its active arc rather than the newly inserted track', () => {
  const loader = new ProgressivePreloader({streamable: true});
  loader.construct();
  expect(loader.circle.classList.contains('preloader-path-new')).toBe(true);
  loader.setProgress(50);
  const wave = loader.preloader.querySelector<SVGPathElement>('.preloader-md3-wave');
  expect(wave.style.strokeDasharray).toBe(loader.circle.style.strokeDasharray);
  expect(parseFloat(loader.circle.style.strokeDasharray)).toBeCloseTo(59.3056);
  loader.setProgress(0);
  expect(wave.style.strokeDasharray).toBe('');
});
