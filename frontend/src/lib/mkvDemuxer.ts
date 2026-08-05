/**
 * Minimal streaming MKV/EBML demuxer.
 * Parses headers first (first ~1MB), then fetches clusters via Range requests
 * to extract H.264/H.265 video frames for WebCodecs decoding.
 */

const EBML = {
  Segment: 0x18538067,
  SeekHead: 0x114d9b74,
  Info: 0x1549a966,
  Tracks: 0x1654ae6b,
  Cluster: 0x1f43b675,
  SimpleBlock: 0xa3,
  Block: 0xa1,
  // TrackEntry
  TrackNumber: 0xd7,
  TrackType: 0x83,
  CodecID: 0x86,
  CodecPrivate: 0x63a2,
  Video: 0xe0,
  Width: 0xb0,
  Height: 0xba,
  PixelHeight: 0xba,
  // BlockGroup
  BlockGroup: 0xa0,
  BlockDuration: 0x9b,
};

function vint(data: Uint8Array, offset: number): { value: number; bytes: number } {
  if (offset >= data.length) return { value: 0, bytes: 0 };
  const b = data[offset];
  if (b & 0x80) return { value: b & 0x7f, bytes: 1 };
  if (b & 0x40) return { value: ((b & 0x3f) << 8) | (data[offset + 1] || 0), bytes: 2 };
  if (b & 0x20) return { value: ((b & 0x1f) << 16) | ((data[offset + 1] || 0) << 8) | (data[offset + 2] || 0), bytes: 3 };
  if (b & 0x10) {
    const v = ((b & 0x0f) << 24) | ((data[offset + 1] || 0) << 16) | ((data[offset + 2] || 0) << 8) | (data[offset + 3] || 0);
    return { value: v >>> 0, bytes: 4 };
  }
  let val = 0;
  const remaining = 8 - Math.clz32(b ^ 0xff);
  for (let i = 0; i < remaining && offset + i < data.length; i++) {
    val = (val << 8) | data[offset + i];
  }
  return { value: val >>> 0, bytes: remaining };
}

function readId(data: Uint8Array, offset: number): { id: number; bytes: number } {
  return vint(data, offset);
}

function readSize(data: Uint8Array, offset: number): { size: number; bytes: number } {
  return vint(data, offset);
}

function readUInt(data: Uint8Array, offset: number, size: number): number {
  let v = 0;
  for (let i = 0; i < size; i++) {
    v = (v << 8) | (data[offset + i] || 0);
  }
  return v;
}

export interface MkvTrack {
  number: number;
  type: number; // 1=video, 2=audio
  codecId: string;
  codecPrivate: Uint8Array | null;
  width: number;
  height: number;
}

export interface MkvFrame {
  trackNumber: number;
  timestamp: number; // ms
  data: Uint8Array;
  isKeyframe: boolean;
}

export interface MkvInfo {
  tracks: MkvTrack[];
  duration: number; // ms
  timecodeScale: number;
}

export class MkvDemuxer {
  private tracks: MkvTrack[] = [];
  private duration = 0;
  private timecodeScale = 1000000; // default: 1ms
  private segmentDataOffset = 0; // absolute offset of Segment data
  private segmentOffset = 0; // file offset of Segment element
  private clusterOffsets: number[] = [];
  private headerParsed = false;

  getTracks(): MkvTrack[] { return this.tracks; }
  getDuration(): number { return this.duration; }

  async probe(url: string): Promise<MkvInfo> {
    const resp = await fetch(url, {
      headers: { Range: 'bytes=0-2097151' }, // first 2MB
    });
    const data = new Uint8Array(await resp.arrayBuffer());
    this.parseHeader(data);
    return {
      tracks: this.tracks,
      duration: this.duration,
      timecodeScale: this.timecodeScale,
    };
  }

  private parseHeader(data: Uint8Array) {
    let offset = 0;

    // Skip EBML header
    const ebmlId = readId(data, offset);
    offset += ebmlId.bytes;
    const ebmlSize = readSize(data, offset);
    offset += ebmlSize.bytes + ebmlSize.bytes; // skip header + data

    // Parse Segment
    while (offset < data.length - 12) {
      const id = readId(data, offset);
      if (id.bytes === 0) break;
      offset += id.bytes;

      const sz = readSize(data, offset);
      if (sz.bytes === 0) break;
      offset += sz.bytes;

      if (id.id === EBML.Segment) {
        this.segmentOffset = offset - id.bytes - sz.bytes;
        this.segmentDataOffset = offset;
        this.parseSegment(data, offset, sz.value === 0 ? data.length - offset : sz.value);
        break;
      }

      // skip unknown top-level elements
      if (sz.value > 0 && sz.value < data.length) {
        offset += sz.value;
      } else {
        break;
      }
    }

    // Scan for clusters in the remaining data
    this.findClusters(data, offset);
  }

  private parseSegment(data: Uint8Array, start: number, segSize: number) {
    let offset = start;
    const end = segSize === 0 ? data.length : Math.min(start + segSize, data.length);

    while (offset < end - 12) {
      const id = readId(data, offset);
      if (id.bytes === 0) break;
      offset += id.bytes;

      const sz = readSize(data, offset);
      if (sz.bytes === 0) break;
      offset += sz.bytes;

      const elemEnd = offset + sz.value;

      if (id.id === EBML.Info) {
        this.parseInfo(data, offset, sz.value);
      } else if (id.id === EBML.Tracks) {
        this.parseTracks(data, offset, sz.value);
      }

      offset = elemEnd;
    }
  }

  private parseInfo(data: Uint8Array, offset: number, size: number) {
    const end = offset + size;
    let off = offset;

    while (off < end - 8) {
      const id = readId(data, off);
      if (id.bytes === 0) break;
      off += id.bytes;

      const sz = readSize(data, off);
      if (sz.bytes === 0) break;
      off += sz.bytes;

      if (id.id === 0x4489) { // Duration
        // float64
        const buf = new ArrayBuffer(8);
        const view = new Uint8Array(buf);
        for (let i = 0; i < Math.min(8, sz.value); i++) {
          view[i] = data[off + i];
        }
        this.duration = new Float64Array(buf)[0] / this.timecodeScale;
      } else if (id.id === 0x2ad7b1) { // TimecodeScale
        this.timecodeScale = readUInt(data, off, sz.value);
      }

      off += sz.value;
    }
  }

  private parseTracks(data: Uint8Array, offset: number, size: number) {
    const end = offset + size;
    let off = offset;

    while (off < end - 10) {
      const id = readId(data, off);
      if (id.bytes === 0) break;
      off += id.bytes;

      const sz = readSize(data, off);
      if (sz.bytes === 0) break;
      off += sz.bytes;

      if (id.id === EBML.TrackEntry) {
        this.parseTrackEntry(data, off, sz.value);
      }

      off += sz.value;
    }
  }

  private parseTrackEntry(data: Uint8Array, offset: number, size: number) {
    const end = offset + size;
    let off = offset;

    const track: MkvTrack = {
      number: 0,
      type: 0,
      codecId: '',
      codecPrivate: null,
      width: 0,
      height: 0,
    };

    while (off < end - 8) {
      const id = readId(data, off);
      if (id.bytes === 0) break;
      off += id.bytes;

      const sz = readSize(data, off);
      if (sz.bytes === 0) break;
      off += sz.bytes;

      if (id.id === EBML.TrackNumber) {
        track.number = readUInt(data, off, sz.value);
      } else if (id.id === EBML.TrackType) {
        track.type = readUInt(data, off, sz.value);
      } else if (id.id === EBML.CodecID) {
        const bytes: number[] = [];
        for (let i = 0; i < sz.value; i++) bytes.push(data[off + i]);
        track.codecId = new TextDecoder().decode(new Uint8Array(bytes));
      } else if (id.id === EBML.CodecPrivate) {
        track.codecPrivate = data.slice(off, off + sz.value);
      } else if (id.id === EBML.Video) {
        this.parseVideo(data, off, sz.value, track);
      }

      off += sz.value;
    }

    if (track.number > 0 && track.type > 0) {
      this.tracks.push(track);
    }
  }

  private parseVideo(data: Uint8Array, offset: number, size: number, track: MkvTrack) {
    const end = offset + size;
    let off = offset;

    while (off < end - 8) {
      const id = readId(data, off);
      if (id.bytes === 0) break;
      off += id.bytes;

      const sz = readSize(data, off);
      if (sz.bytes === 0) break;
      off += sz.bytes;

      if (id.id === EBML.Width || id.id === 0xB0) {
        track.width = readUInt(data, off, sz.value);
      } else if (id.id === EBML.PixelHeight || id.id === 0xBA) {
        track.height = readUInt(data, off, sz.value);
      }

      off += sz.value;
    }
  }

  private findClusters(data: Uint8Array, fromOffset: number) {
    let offset = fromOffset;
    while (offset < data.length - 12) {
      // Look for cluster magic bytes
      if (data[offset] === 0x1f && data[offset + 1] === 0x43 &&
          data[offset + 2] === 0xb6 && data[offset + 3] === 0x75) {
        this.clusterOffsets.push(offset);
      }
      offset++;
    }
  }

  async *readFrames(url: string, startMs = 0): AsyncGenerator<MkvFrame> {
    const fileSize = await this.getFileSize(url);
    if (fileSize <= 0) return;

    // Find clusters beyond the initial probe
    const clusterStartOffset = this.segmentDataOffset;
    const initialDataEnd = 2097152; // 2MB initial fetch

    // If we have clusters from initial probe, yield frames from them
    if (this.clusterOffsets.length > 0) {
      // Re-read the initial data to parse clusters
      const resp = await fetch(url, {
        headers: { Range: `bytes=0-${Math.min(initialDataEnd, fileSize) - 1}` },
      });
      const data = new Uint8Array(await resp.arrayBuffer());

      for (const clusterOffset of this.clusterOffsets) {
        const frames = this.parseCluster(data, clusterOffset);
        for (const frame of frames) {
          if (frame.timestamp >= startMs) {
            yield frame;
          }
        }
      }
    }

    // Continue reading remaining clusters via Range requests
    let readOffset = initialDataEnd;
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks

    while (readOffset < fileSize) {
      const end = Math.min(readOffset + chunkSize, fileSize);
      const resp = await fetch(url, {
        headers: { Range: `bytes=${readOffset}-${end - 1}` },
      });
      const data = new Uint8Array(await resp.arrayBuffer());

      // Find clusters in this chunk
      const clusters: number[] = [];
      for (let i = 0; i < data.length - 4; i++) {
        if (data[i] === 0x1f && data[i + 1] === 0x43 &&
            data[i + 2] === 0xb6 && data[i + 3] === 0x75) {
          clusters.push(i);
        }
      }

      for (const clusterOffset of clusters) {
        const frames = this.parseCluster(data, clusterOffset);
        for (const frame of frames) {
          if (frame.timestamp >= startMs) {
            yield frame;
          }
        }
      }

      readOffset = end;
    }
  }

  private parseCluster(data: Uint8Array, offset: number): MkvFrame[] {
    const frames: MkvFrame[] = [];
    let off = offset + 4; // skip cluster ID

    if (off >= data.length) return frames;

    // Read cluster size
    const sz = readSize(data, off);
    if (sz.bytes === 0) return frames;
    off += sz.bytes;

    const clusterEnd = Math.min(off + sz.value, data.length);
    let clusterTimecode = 0;

    // Parse cluster header elements (Timecode, etc.)
    while (off < clusterEnd - 12) {
      const id = readId(data, off);
      if (id.bytes === 0) break;
      off += id.bytes;

      const elemSize = readSize(data, off);
      if (elemSize.bytes === 0) break;
      off += elemSize.bytes;

      if (id.id === 0xe7) { // Cluster Timecode
        clusterTimecode = readUInt(data, off, elemSize.value);
      } else if (id.id === EBML.SimpleBlock) {
        const frame = this.parseSimpleBlock(data, off, elemSize.value, clusterTimecode);
        if (frame) frames.push(frame);
      } else if (id.id === EBML.BlockGroup) {
        const bgFrames = this.parseBlockGroup(data, off, elemSize.value, clusterTimecode);
        frames.push(...bgFrames);
      }

      off += elemSize.value;
    }

    return frames;
  }

  private parseSimpleBlock(data: Uint8Array, offset: number, size: number, clusterTimecode: number): MkvFrame | null {
    let off = offset;

    // Track number (VINT)
    const tn = vint(data, off);
    if (tn.bytes === 0) return null;
    off += tn.bytes;

    // Timecode (int16 relative to cluster)
    if (off + 2 > offset + size) return null;
    const timecode = clusterTimecode + ((data[off] << 8) | data[off + 1]);
    off += 2;

    // Flags (1 byte)
    if (off >= offset + size) return null;
    const flags = data[off];
    off += 1;
    const isKeyframe = (flags & 0x80) !== 0;

    const frameData = data.slice(off, offset + size);

    return {
      trackNumber: tn.value,
      timestamp: timecode * this.timecodeScale / 1000000, // convert to ms
      data: frameData,
      isKeyframe,
    };
  }

  private parseBlockGroup(data: Uint8Array, offset: number, size: number, clusterTimecode: number): MkvFrame[] {
    const frames: MkvFrame[] = [];
    let off = offset;
    const end = offset + size;

    while (off < end - 10) {
      const id = readId(data, off);
      if (id.bytes === 0) break;
      off += id.bytes;

      const sz = readSize(data, off);
      if (sz.bytes === 0) break;
      off += sz.bytes;

      if (id.id === EBML.Block) {
        const frame = this.parseSimpleBlock(data, off, sz.value, clusterTimecode);
        if (frame) frames.push(frame);
      }

      off += sz.value;
    }

    return frames;
  }

  private async getFileSize(url: string): Promise<number> {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      const range = resp.headers.get('content-range');
      if (range) {
        const match = range.match(/\/(\d+)/);
        if (match) return parseInt(match[1], 10);
      }
      return parseInt(resp.headers.get('content-length') || '0', 10);
    } catch {
      return 0;
    }
  }
}

/**
 * Build H.264 decoder config from MKV CodecPrivate (AVCC format)
 */
export function buildAvcConfig(codecPrivate: Uint8Array): ArrayBuffer {
  // AVCC format: [version][profile][compat][level][lengthSizeMinusOne][numSPS][SPS...][numPPS][PPS...]
  // WebCodecs wants raw SPS+PPS prefixed with start codes
  const result: number[] = [];
  let off = 5; // skip version, profile, compat, level, lengthSizeMinusOne

  const numSPS = codecPrivate[off] & 0x1f;
  off++;
  for (let i = 0; i < numSPS; i++) {
    const spsLen = (codecPrivate[off] << 8) | codecPrivate[off + 1];
    off += 2;
    result.push(0, 0, 0, 1); // start code
    for (let j = 0; j < spsLen; j++) result.push(codecPrivate[off + j]);
    off += spsLen;
  }

  const numPPS = codecPrivate[off];
  off++;
  for (let i = 0; i < numPPS; i++) {
    const ppsLen = (codecPrivate[off] << 8) | codecPrivate[off + 1];
    off += 2;
    result.push(0, 0, 0, 1); // start code
    for (let j = 0; j < ppsLen; j++) result.push(codecPrivate[off + j]);
    off += ppsLen;
  }

  return new Uint8Array(result).buffer;
}

/**
 * Build H.265 decoder config from MKV CodecPrivate (HVCC format)
 */
export function buildHevcConfig(codecPrivate: Uint8Array): ArrayBuffer {
  // HVCC contains arrays of NAL units. WebCodecs needs them with start codes.
  const result: number[] = [];
  let off = 23; // skip fixed header

  const numOfArrays = codecPrivate[off];
  off++;

  for (let i = 0; i < numOfArrays; i++) {
    off++; // array_completeness + NAL unit type
    const numNalus = (codecPrivate[off] << 8) | codecPrivate[off + 1];
    off += 2;

    for (let j = 0; j < numNalus; j++) {
      const naluLen = (codecPrivate[off] << 8) | codecPrivate[off + 1];
      off += 2;
      result.push(0, 0, 0, 1); // start code
      for (let k = 0; k < naluLen; k++) result.push(codecPrivate[off + k]);
      off += naluLen;
    }
  }

  return new Uint8Array(result).buffer;
}
