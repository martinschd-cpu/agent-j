export interface SseFrame {
  /** `message` when the frame has no `event:` line. */
  event: string;
  data: string;
  id?: string;
}

/**
 * Incremental parser for `text/event-stream`. Feed it decoded chunks in any size; it returns the
 * frames that are complete so far. Comment lines (`: keepalive`) are ignored.
 */
export class SseParser {
  private buffer = '';
  private event = '';
  private data: string[] = [];
  private id: string | undefined;

  feed(chunk: string): SseFrame[] {
    this.buffer += chunk;
    const frames: SseFrame[] = [];
    let nl: number;
    while ((nl = this.buffer.search(/\r\n|\r|\n/)) >= 0) {
      const line = this.buffer.slice(0, nl);
      const sepLength = this.buffer.startsWith('\r\n', nl) ? 2 : 1;
      // A lone "\r" at the end of the buffer may be the first half of "\r\n".
      if (this.buffer[nl] === '\r' && nl + 1 === this.buffer.length) break;
      this.buffer = this.buffer.slice(nl + sepLength);
      const frame = this.line(line);
      if (frame) frames.push(frame);
    }
    return frames;
  }

  /** Flushes a last frame that was not terminated by a blank line. */
  end(): SseFrame[] {
    const frames = this.buffer ? this.feed('\n') : [];
    const last = this.line('');
    return last ? [...frames, last] : frames;
  }

  private line(line: string): SseFrame | undefined {
    if (line === '') {
      if (this.data.length === 0 && !this.event) return undefined;
      const frame: SseFrame = { event: this.event || 'message', data: this.data.join('\n') };
      if (this.id !== undefined) frame.id = this.id;
      this.event = '';
      this.data = [];
      return frame;
    }
    if (line.startsWith(':')) return undefined;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') this.event = value;
    else if (field === 'data') this.data.push(value);
    else if (field === 'id') this.id = value;
    return undefined;
  }
}
