/**
 * Streaming MKV player using WebCodecs + canvas rendering.
 * Fetches MKV via Range requests, demuxes incrementally,
 * decodes with WebCodecs VideoDecoder, renders to canvas.
 */
import { MkvDemuxer, buildAvcConfig, buildHevcConfig, type MkvFrame, type MkvTrack } from './mkvDemuxer';

export interface StreamingPlayerOptions {
  url: string;
  canvas: HTMLCanvasElement;
  onTimeUpdate?: (time: number, duration: number) => void;
  onStateChange?: (state: string) => void;
  onProgress?: (stage: string, percent: number) => void;
  onError?: (error: string) => void;
}

export class StreamingPlayer {
  private opts: StreamingPlayerOptions;
  private demuxer: MkvDemuxer;
  private videoDecoder: VideoDecoder | null = null;
  private audioCtx: AudioContext | null = null;
  private canvasCtx: CanvasRenderingContext2D;
  private state: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' = 'idle';
  private frameQueue: { frame: VideoFrame; timeMs: number }[] = [];
  private audioQueue: { data: Float32Array; timeMs: number }[] = [];
  private startTime = 0;
  private pauseTime = 0;
  private currentTime = 0;
  private duration = 0;
  private animFrame = 0;
  private audioTrack: MkvTrack | null = null;
  private videoTrack: MkvTrack | null = null;
  private destroyFlag = false;
  private frameGenerator: AsyncGenerator<MkvFrame> | null = null;
  private frameIteratorRunning = false;
  private canvas: HTMLCanvasElement;

  constructor(opts: StreamingPlayerOptions) {
    this.opts = opts;
    this.canvas = opts.canvas;
    this.canvasCtx = opts.canvas.getContext('2d')!;
    this.demuxer = new MkvDemuxer();
  }

  async load(): Promise<void> {
    this.setState('loading');
    this.opts.onProgress?.('probing', 0);

    // Probe MKV header to get tracks + duration
    const info = await this.demuxer.probe(this.opts.url);
    this.duration = info.duration || 0;

    // Find video track
    this.videoTrack = info.tracks.find(t => t.type === 1) || null;
    this.audioTrack = info.tracks.find(t => t.type === 2) || null;

    if (!this.videoTrack) throw new Error('No video track found');

    this.opts.onProgress?.('initializing-codec', 20);

    // Determine codec from MKV track
    const codecId = this.videoTrack.codecId;
    const isHevc = /HEVC|H\.265|V_MPEGH/i.test(codecId);
    const codec = isHevc ? 'hev1.1.6.L120.90' : 'avc1.640028';

    // Build decoder config from CodecPrivate
    let description: ArrayBuffer | undefined;
    if (this.videoTrack.codecPrivate) {
      description = isHevc
        ? buildHevcConfig(this.videoTrack.codecPrivate)
        : buildAvcConfig(this.videoTrack.codecPrivate);
    }

    // Check WebCodecs support
    const support = await VideoDecoder.isConfigSupported({
      codec,
      codedWidth: this.videoTrack.width || 1920,
      codedHeight: this.videoTrack.height || 1080,
      description,
    });
    if (!support.supported) throw new Error(`WebCodecs does not support ${codec}`);

    // Create VideoDecoder
    this.videoDecoder = new VideoDecoder({
      output: (frame: VideoFrame) => {
        this.frameQueue.push({ frame, timeMs: Number(frame.timestamp) });
      },
      error: (e) => {
        console.error('[StreamingPlayer] Decoder error:', e);
      },
    });

    this.videoDecoder.configure({
      codec,
      codedWidth: this.videoTrack.width || 1920,
      codedHeight: this.videoTrack.height || 1080,
      description,
    });

    // Set up canvas dimensions
    this.canvas.width = this.videoTrack.width || 1920;
    this.canvas.height = this.videoTrack.height || 1080;

    // Set up audio if available
    if (this.audioTrack) {
      const audioCodecId = this.audioTrack.codecId;
      // We'll decode audio frames manually with raw PCM from Web Audio
      // For now, audio is best-effort — video is the priority
    }

    this.opts.onProgress?.('streaming', 50);
    this.setState('loading');
  }

  play(): void {
    if (this.state === 'ended') return;

    if (this.state === 'paused') {
      this.startTime = performance.now() - this.pauseTime * 1000;
    } else {
      this.startTime = performance.now();
      this.pauseTime = 0;
    }

    this.setState('playing');

    // Start feeding frames from demuxer
    if (!this.frameIteratorRunning) {
      this.frameIteratorRunning = true;
      this.feedFrames().catch(e => {
        console.error('[StreamingPlayer] Feed error:', e);
        this.opts.onError?.(`Feed error: ${e}`);
      });
    }

    // Start render loop
    this.renderLoop();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.pauseTime = this.currentTime;
    this.setState('paused');
    cancelAnimationFrame(this.animFrame);
  }

  seek(timeMs: number): void {
    this.pauseTime = timeMs / 1000;
    this.startTime = performance.now() - timeMs;
    this.currentTime = timeMs / 1000;
    // Clear frame queue
    this.frameQueue.forEach(f => f.frame.close());
    this.frameQueue = [];
    // TODO: re-seek in generator
  }

  destroy(): void {
    this.destroyFlag = true;
    cancelAnimationFrame(this.animFrame);
    this.videoDecoder?.close();
    this.frameQueue.forEach(f => f.frame.close());
    this.frameQueue = [];
    this.audioCtx?.close();
    this.setState('idle');
  }

  private setState(s: string) {
    this.state = s as typeof this.state;
    this.opts.onStateChange?.(s);
  }

  private async feedFrames(): Promise<void> {
    if (!this.videoDecoder || !this.videoTrack) return;

    this.frameGenerator = this.demuxer.readFrames(this.opts.url);

    let frameCount = 0;
    const startTime = performance.now();

    for await (const mkvFrame of this.frameGenerator) {
      if (this.destroyFlag) break;

      // Only process video track frames
      if (mkvFrame.trackNumber !== this.videoTrack.number) continue;

      // Build EncodedVideoChunk
      const type = mkvFrame.isKeyframe ? 'key' : 'delta';
      const chunk = new EncodedVideoChunk({
        type,
        timestamp: mkvFrame.timestamp * 1000, // ms → μs
        data: mkvFrame.data,
      });

      this.videoDecoder.encode(chunk);

      frameCount++;
      if (frameCount % 30 === 0) {
        const elapsed = (performance.now() - startTime) / 1000;
        const fps = frameCount / elapsed;
        this.opts.onProgress?.('decoding', Math.min(90, 50 + frameCount / 10));
        console.log(`[StreamingPlayer] Decoded ${frameCount} frames (${fps.toFixed(1)} fps)`);
      }
    }

    this.frameIteratorRunning = false;
    console.log(`[StreamingPlayer] Finished decoding ${frameCount} frames`);
  }

  private renderLoop(): void {
    if (this.state !== 'playing') return;

    const now = performance.now();
    this.currentTime = (now - this.startTime) / 1000;

    this.opts.onTimeUpdate?.(this.currentTime, this.duration);

    // Find the right frame to display
    const currentTimeUs = this.currentTime * 1000000;

    while (this.frameQueue.length > 1 && this.frameQueue[1].timeMs * 1000 <= currentTimeUs) {
      const old = this.frameQueue.shift()!;
      old.frame.close();
    }

    if (this.frameQueue.length > 0) {
      const peek = this.frameQueue[0];
      const frameTimeUs = peek.timeMs * 1000;
      if (frameTimeUs <= currentTimeUs + 33333) { // within ~1 frame tolerance
        const vf = peek.frame;
        this.canvasCtx.drawImage(vf, 0, 0, this.canvas.width, this.canvas.height);
      }
    }

    // Check if ended
    if (this.duration > 0 && this.currentTime >= this.duration && this.frameQueue.length === 0) {
      this.setState('ended');
      return;
    }

    this.animFrame = requestAnimationFrame(() => this.renderLoop());
  }

  getState(): string { return this.state; }
  getCurrentTime(): number { return this.currentTime; }
  getDuration(): number { return this.duration; }
}
