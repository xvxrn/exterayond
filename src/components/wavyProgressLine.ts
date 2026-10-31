import MediaProgressLine from '@components/mediaProgressLine';
import {observeResize} from '@components/resizeObserver';
import liteMode from '@helpers/liteMode';

const TAU = Math.PI * 2;
/** Android `WavySeekBar`: 4dp stroke, 34dp wavelength, 2dp step, dp(4) amplitude. */
const STROKE_WIDTH = 4;
const WAVELENGTH = 34;
const STEP = 2;
const MAX_AMPLITUDE = 4;
/** The wave's own box: amplitude and half the stroke fit on both sides of the middle. */
const WAVE_HEIGHT = (MAX_AMPLITUDE + STROKE_WIDTH / 2) * 2;
const PHASE_SPEED = 6;
/** The straight fill is hidden only once the wave is actually visible. */
const AMPLITUDE_EPSILON = 0.05;

const round = (value: number) => Math.round(value * 100) / 100;

type MediaOptions = {media: HTMLMediaElement, streamable?: boolean, duration?: number};

/**
 * The filled part of the playback bar as a wave, Android `WavySeekBar` in the
 * MD3 player: the amplitude rises to `maxAmplitude` while playing and eases
 * back to the straight line when paused. `OEPlayerWavy=false` feeds
 * `maxAmplitude` 0, which keeps Web K's own flat bar. Seeking stays with
 * `MediaProgressLine`; a playback bar follows the tape, so the wave keeps
 * physical coordinates and never mirrors in RTL. A looping wave is decorative
 * movement, so it needs the full animation level.
 */
export default class WavyProgressLine extends MediaProgressLine {
  private maxAmplitude: number;
  private amplitude = 0;
  private phase = 0;
  private lastFrame = 0;
  private raf = 0;
  private width = 0;
  private playing = false;
  private svg: SVGSVGElement;
  private path: SVGPathElement;
  private unobserveWidth?: () => void;
  private waveListeners: (() => void)[] = [];

  constructor(options: ConstructorParameters<typeof MediaProgressLine>[0], maxAmplitude = MAX_AMPLITUDE) {
    super(options);
    this.maxAmplitude = maxAmplitude;

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('progress-line__wave');
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.style.height = WAVE_HEIGHT + 'px';
    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.style.strokeWidth = STROKE_WIDTH + 'px';
    this.path.style.strokeLinecap = 'round';
    this.path.style.fill = 'none';
    this.svg.append(this.path);
    this.filled.append(this.svg);

    this.unobserveWidth = observeResize(this.container, () => {
      this.width = this.container.clientWidth;
      this.renderWave();
      this.ensureLoop();
    });
    this.width = this.container.clientWidth;
  }

  public setMedia({media, ...rest}: MediaOptions) {
    super.setMedia({media, ...rest});
    this.removeWaveListeners();
    if(!media) {
      return;
    }

    this.playing = !media.paused;
    this.ensureLoop();
    for(const event of ['play', 'playing'] as const) {
      media.addEventListener(event, this.onWavePlay);
      this.waveListeners.push(() => media.removeEventListener(event, this.onWavePlay));
    }

    for(const event of ['pause', 'ended'] as const) {
      media.addEventListener(event, this.onWavePause);
      this.waveListeners.push(() => media.removeEventListener(event, this.onWavePause));
    }

    this.renderWave();
  }

  public setMaxAmplitude(value: number) {
    this.maxAmplitude = value;
    this.ensureLoop();
  }

  public getMaxAmplitude() {
    return this.maxAmplitude;
  }

  private onWavePlay = () => {
    this.playing = true;
    this.lastFrame = 0;
    this.ensureLoop();
  };

  private onWavePause = () => {
    this.playing = false;
    this.ensureLoop();
  };

  public setFilled(value: number) {
    super.setFilled(value);
    this.renderWave();
    this.ensureLoop();
  }

  private renderWave() {
    if(!this.path) {
      return;
    }

    const active = this.amplitude > AMPLITUDE_EPSILON;
    this.container.classList.toggle('is-wavy', active);
    if(!active) {
      this.path.removeAttribute('d');
      this.svg.removeAttribute('viewBox');
      return;
    }

    const width = this.width;
    this.svg.setAttribute('viewBox', `0 0 ${round(width)} ${WAVE_HEIGHT}`);
    if(width <= 0) {
      this.path.removeAttribute('d');
      return;
    }

    const points: string[] = [];
    for(let x = 0; ; x += STEP) {
      const last = x >= width;
      const px = last ? width : x;
      const y = WAVE_HEIGHT / 2 + this.amplitude * Math.sin(TAU * px / WAVELENGTH - this.phase);
      points.push(`${points.length ? 'L' : 'M'}${round(px)} ${round(y)}`);
      if(last) {
        break;
      }
    }

    this.path.setAttribute('d', points.join(''));
  }

  /** The loop runs while the wave is visible or still easing toward its target. */
  private ensureLoop() {
    const target = this.playing && liteMode.isAvailable('motion') ? this.maxAmplitude : 0;
    if(!this.raf && (target > 0 || this.amplitude > 0)) {
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = (now: number) => {
    this.raf = 0;
    const dt = this.lastFrame ? Math.min(0.05, (now - this.lastFrame) / 1000) : 0.016;
    this.lastFrame = now;
    const target = this.playing && liteMode.isAvailable('motion') ? this.maxAmplitude : 0;
    // * Android's exponential approach: 85% of the remaining distance per 40ms
    this.amplitude += (target - this.amplitude) * (1 - Math.pow(0.85, dt / 0.04));
    if(Math.abs(this.amplitude - target) < AMPLITUDE_EPSILON) {
      this.amplitude = target;
    }

    if(this.amplitude > 0) {
      this.phase = (this.phase + PHASE_SPEED * dt) % TAU;
    }

    this.renderWave();
    if(this.amplitude > 0 || target !== this.amplitude) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.lastFrame = 0;
    }
  };

  private removeWaveListeners() {
    for(const remove of this.waveListeners) remove();
    this.waveListeners = [];
  }

  public removeListeners() {
    super.removeListeners();
    this.removeWaveListeners();
    this.playing = false;
    if(this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.lastFrame = 0;
    }

    this.unobserveWidth?.();
    this.unobserveWidth = undefined;
  }
}
