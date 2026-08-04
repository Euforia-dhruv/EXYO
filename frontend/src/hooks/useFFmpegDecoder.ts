import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

interface UseFFmpegDecoderReturn {
  remuxToMp4: (inputUrl: string) => Promise<string | null>;
  isRemuxing: boolean;
  progress: number;
  error: string | null;
  clearCache: () => void;
}

const remuxCache = new Map<string, string>();

export const useFFmpegDecoder = (): UseFFmpegDecoderReturn => {
  const [isRemuxing, setIsRemuxing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const initFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();

    await ffmpeg.load({
      coreURL: await toBlobURL(
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        'text/javascript'
      ),
      wasmURL: await toBlobURL(
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        'application/wasm'
      ),
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  const remuxToMp4 = useCallback(async (inputUrl: string): Promise<string | null> => {
    if (remuxCache.has(inputUrl)) {
      return remuxCache.get(inputUrl) || null;
    }

    setIsRemuxing(true);
    setProgress(0);
    setError(null);

    try {
      const response = await fetch(inputUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.arrayBuffer();
      setProgress(20);

      const ffmpeg = await initFFmpeg();
      setProgress(40);

      await ffmpeg.writeFile('input.mkv', new Uint8Array(data));
      setProgress(60);

      await ffmpeg.exec(['-i', 'input.mkv', '-c', 'copy', '-movflags', 'faststart', 'output.mp4']);
      setProgress(80);

      const outputData = (await ffmpeg.readFile('output.mp4')) as Uint8Array;
      const blob = new Blob([outputData.slice().buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setProgress(100);

      await ffmpeg.deleteFile('input.mkv');
      await ffmpeg.deleteFile('output.mp4');

      remuxCache.set(inputUrl, url);
      setIsRemuxing(false);
      return url;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Remux failed';
      setError(errorMsg);
      setIsRemuxing(false);
      return null;
    }
  }, [initFFmpeg]);

  const clearCache = useCallback(() => {
    for (const [, url] of remuxCache) {
      URL.revokeObjectURL(url);
    }
    remuxCache.clear();
  }, []);

  return { remuxToMp4, isRemuxing, progress, error, clearCache };
};
