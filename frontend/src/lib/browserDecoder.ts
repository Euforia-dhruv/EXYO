let ffmpegInstance: any | null = null;
let ffmpegPromise: Promise<any> | null = null;

async function getFFmpeg(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegPromise;
}

export interface DecodeResult {
  blobUrl: string;
  format: 'mp4' | 'webm' | 'ts';
  duration: number;
  width: number;
  height: number;
}

export async function remuxToSupported(
  inputUrl: string,
  inputFormat: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<DecodeResult> {
  const cacheKey = `remux:${inputUrl}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  onProgress?.('loading-ffmpeg', 0);
  const ffmpeg = await getFFmpeg();
  onProgress?.('fetching', 10);

  const response = await fetch(inputUrl);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

  const data = new Uint8Array(await response.arrayBuffer());
  onProgress?.('writing', 30);

  const ext = inputFormat === 'mkv' ? 'mkv' :
              inputFormat === 'avi' ? 'avi' :
              inputFormat === 'flv' ? 'flv' :
              inputFormat === 'ts' ? 'ts' : 'bin';

  await ffmpeg.writeFile(`input.${ext}`, data);
  onProgress?.('converting', 50);

  try {
    await ffmpeg.exec([
      '-i', `input.${ext}`,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-movflags', 'faststart',
      '-f', 'mp4',
      'output.mp4'
    ]);
  } catch {
    await ffmpeg.exec([
      '-i', `input.${ext}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-movflags', 'faststart',
      '-f', 'mp4',
      'output.mp4'
    ]);
  }

  onProgress?.('reading', 80);

  const outputData = (await ffmpeg.readFile('output.mp4')) as Uint8Array;
  const blob = new Blob([new Uint8Array(outputData).buffer as ArrayBuffer], { type: 'video/mp4' });
  const blobUrl = URL.createObjectURL(blob);

  await ffmpeg.deleteFile(`input.${ext}`).catch(() => {});
  await ffmpeg.deleteFile('output.mp4').catch(() => {});

  const result: DecodeResult = {
    blobUrl,
    format: 'mp4',
    duration: 0,
    width: 0,
    height: 0,
  };

  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  onProgress?.('done', 100);
  return result;
}

export async function transcodeForBrowser(
  inputUrl: string,
  inputFormat: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<string> {
  const cacheKey = `transcode:${inputUrl}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  onProgress?.('loading-ffmpeg', 0);
  const ffmpeg = await getFFmpeg();

  onProgress?.('fetching', 10);
  const response = await fetch(inputUrl);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

  const data = new Uint8Array(await response.arrayBuffer());
  onProgress?.('writing', 25);

  const ext = inputFormat || 'bin';
  await ffmpeg.writeFile(`input.${ext}`, data);
  onProgress?.('transcoding', 40);

  await ffmpeg.exec([
    '-i', `input.${ext}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', 'faststart',
    '-f', 'mp4',
    'output.mp4'
  ]);

  onProgress?.('reading', 85);

  const outputData = (await ffmpeg.readFile('output.mp4')) as Uint8Array;
  const blob = new Blob([new Uint8Array(outputData).buffer as ArrayBuffer], { type: 'video/mp4' });
  const blobUrl = URL.createObjectURL(blob);

  await ffmpeg.deleteFile(`input.${ext}`).catch(() => {});
  await ffmpeg.deleteFile('output.mp4').catch(() => {});

  sessionStorage.setItem(cacheKey, blobUrl);
  onProgress?.('done', 100);
  return blobUrl;
}
