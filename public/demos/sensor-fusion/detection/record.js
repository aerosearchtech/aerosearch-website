// Canvas capture for the replay video. Mirrors the layer explorer recorder:
// record one full survey at a fixed frame rate and hand back a WebM download.

import { REPLAY } from './colors.js';

const MIMES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

export const RECORD_FILENAME = 'site2-detection-replay.webm';

export function recordingSupported() {
  return Boolean(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream
    && MIMES.some((mime) => MediaRecorder.isTypeSupported(mime)));
}

function save(blob, mime) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = RECORD_FILENAME;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return mime;
}

export function createRecorder(canvas, onFinish) {
  let recorder = null;
  let stream = null;
  return {
    get running() { return recorder !== null; },
    start() {
      const mime = MIMES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      stream = canvas.captureStream(REPLAY.recordFps);
      const chunks = [];
      recorder = new MediaRecorder(stream,
        { mimeType: mime, videoBitsPerSecond: REPLAY.recordBitrate });
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        save(new Blob(chunks, { type: mime }), mime);
        stream.getTracks().forEach((track) => track.stop());
        recorder = null;
        stream = null;
        onFinish();
      };
      recorder.start();
    },
    stop() {
      if (recorder) recorder.stop();
    },
  };
}
