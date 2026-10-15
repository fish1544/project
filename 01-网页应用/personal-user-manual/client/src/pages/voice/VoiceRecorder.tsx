import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, X, Type } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
  initialDuration?: number;
  initialAudioUrl?: string | null;
}

const VoiceRecorder = ({
  onRecordingComplete,
  onCancel,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [textDuration, setTextDuration] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream: MediaStream =
        await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      const recorder: MediaRecorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      accumulatedRef.current = 0;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const totalSeconds = Math.max(1, Math.floor(accumulatedRef.current / 1000));
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        onRecordingComplete(blob, totalSeconds);
      };

      recorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      timerRef.current = setInterval(() => {
        accumulatedRef.current =
          accumulatedRef.current + (Date.now() - startTimeRef.current);
        startTimeRef.current = Date.now();
        setDuration(Math.floor(accumulatedRef.current / 1000));
      }, 200);
    } catch (err) {
      setError('无法访问麦克风，已切换到文本记录模式');
      setTextMode(true);
      cleanup();
    }
  };

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    if (timerRef.current) {
      accumulatedRef.current += Date.now() - startTimeRef.current;
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      accumulatedRef.current =
        accumulatedRef.current + (Date.now() - startTimeRef.current);
      startTimeRef.current = Date.now();
      setDuration(Math.floor(accumulatedRef.current / 1000));
    }, 200);
    setIsPaused(false);
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleTextSubmit = () => {
    const seconds = Math.max(0, parseInt(textDuration, 10) || 0);
    onRecordingComplete(new Blob([], { type: 'text/plain' }), seconds);
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 初始界面：大录音按钮
  if (!isRecording && !textMode) {
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={startRecording}
          className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
          aria-label="开始录音"
        >
          <Mic className="w-12 h-12 md:w-14 md:h-14" />
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          点击按钮开始录音
        </p>
        <button
          onClick={() => setTextMode(true)}
          className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Type className="w-3 h-3" />
          切换到文本记录
        </button>
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }

  // 文本模式
  if (textMode) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">文本记录模式</h3>
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            取消
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              记录时长（秒）
            </label>
            <input
              type="number"
              min="0"
              value={textDuration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTextDuration(e.target.value)
              }
              placeholder="例如：120"
              className="w-full h-11 px-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground bg-background"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTextMode(false)}
              className="flex-1 h-11 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              返回录音
            </button>
            <button
              onClick={handleTextSubmit}
              className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              继续编辑
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 录音中
  return (
    <div className="flex flex-col items-center">
      {/* 波形动画 */}
      <div className="flex items-end gap-1.5 h-16 mb-4">
        {[...Array(7)].map((_, i: number) => (
          <div
            key={i}
            className={`w-1.5 rounded-full bg-primary ${
              !isPaused ? 'animate-voice-wave' : ''
            }`}
            style={{
              animationDelay: `${i * 0.1}s`,
              height: isPaused ? '20%' : undefined,
            }}
          />
        ))}
      </div>

      {/* 时长 */}
      <div className="text-3xl font-mono font-semibold text-foreground mb-6">
        {formatTime(duration)}
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-6">
        <button
          onClick={onCancel}
          className="w-12 h-12 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
          aria-label="取消"
        >
          <X className="w-5 h-5" />
        </button>

        <button
          onClick={stopRecording}
          className="w-20 h-20 rounded-full bg-destructive text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center animate-recording-pulse"
          aria-label="停止录音"
        >
          <Square className="w-8 h-8 fill-current" />
        </button>

        <button
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="w-12 h-12 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
          aria-label={isPaused ? '继续' : '暂停'}
        >
          {isPaused ? (
            <Play className="w-5 h-5" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
        </button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {isPaused ? '已暂停' : '正在录音...点击方块停止'}
      </p>
    </div>
  );
};

export default VoiceRecorder;
