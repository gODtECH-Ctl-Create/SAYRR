export interface AudioCaptureOptions {
  sampleRate?: 8000 | 16000 | 24000 | 32000 | 44100 | 48000;
  onChunk: (chunk: Uint8Array) => void;
}

export interface AudioCaptureSession {
  stop(): Promise<void>;
}

function downsampleToInt16(input: Float32Array, inputRate: number, outputRate: number): Uint8Array {
  if (outputRate > inputRate) {
    throw new Error(`Cannot upsample microphone audio from ${inputRate}Hz to ${outputRate}Hz in the desktop prototype`);
  }

  const ratio = inputRate / outputRate;
  const outputLength = Math.round(input.length / ratio);
  const buffer = new ArrayBuffer(outputLength * 2);
  const view = new DataView(buffer);

  let inputOffset = 0;
  for (let outputOffset = 0; outputOffset < outputLength; outputOffset += 1) {
    const nextInputOffset = Math.min(Math.round((outputOffset + 1) * ratio), input.length);
    let sum = 0;
    let count = 0;

    for (; inputOffset < nextInputOffset; inputOffset += 1) {
      sum += input[inputOffset];
      count += 1;
    }

    const sample = Math.max(-1, Math.min(1, count > 0 ? sum / count : 0));
    view.setInt16(outputOffset * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

export async function startMicrophoneCapture(options: AudioCaptureOptions): Promise<AudioCaptureSession> {
  const targetRate = options.sampleRate ?? 16000;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const silentGain = context.createGain();
  silentGain.gain.value = 0;

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    try {
      options.onChunk(downsampleToInt16(input, context.sampleRate, targetRate));
    } catch (error) {
      console.error("SAYRR audio conversion error", error);
    }
  };

  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(context.destination);

  return {
    async stop() {
      processor.onaudioprocess = null;
      processor.disconnect();
      source.disconnect();
      silentGain.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      await context.close();
    },
  };
}
