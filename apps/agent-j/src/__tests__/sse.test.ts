import { SseParser } from '@/api/http/sse';

describe('SseParser', () => {
  it('parses named events and ignores keepalive comments', () => {
    const p = new SseParser();
    const frames = p.feed(
      ': keepalive\n\nevent: assistant.delta\ndata: {"delta":"Hal"}\n\nevent: done\ndata: {}\n\n',
    );
    expect(frames).toEqual([
      { event: 'assistant.delta', data: '{"delta":"Hal"}' },
      { event: 'done', data: '{}' },
    ]);
  });

  it('handles frames split across chunks, CRLF and multi-line data', () => {
    const p = new SseParser();
    expect(p.feed('event: tool.sta')).toEqual([]);
    expect(p.feed('rted\r\ndata: line1\r')).toEqual([]);
    expect(p.feed('\ndata: line2\r\n\r\n')).toEqual([
      { event: 'tool.started', data: 'line1\nline2' },
    ]);
  });

  it('defaults the event name and keeps the last id', () => {
    const p = new SseParser();
    expect(p.feed('id: 7\ndata: x\n\n')).toEqual([{ event: 'message', data: 'x', id: '7' }]);
  });

  it('flushes an unterminated last frame on end()', () => {
    const p = new SseParser();
    p.feed('event: done\ndata: {}');
    expect(p.end()).toEqual([{ event: 'done', data: '{}' }]);
  });
});
