import { useState, useRef, useCallback } from 'react';

interface UseRecordingReturn {
  isRecording: boolean;
  isScreenRecording: boolean;
  isVoiceRecording: boolean;
  isCameraRecording: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleScreen: () => void;
  toggleVoice: () => void;
  toggleCamera: () => void;
  toggleCameraFacingMode: () => void;
  recordedBlob: Blob | null;
  cameraStream: MediaStream | null;
  error: string | null;
  cameraFacingMode: 'user' | 'environment';
}

export const useRecording = (): UseRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(true);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isCameraRecording, setIsCameraRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const getScreenStream = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        } as any,
        audio: false
      });
      return stream;
    } catch (err) {
      console.error('Error getting screen stream:', err);
      setError('Failed to access screen recording');
      return null;
    }
  };

  const getAudioStream = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      return stream;
    } catch (err) {
      console.error('Error getting audio stream:', err);
      setError('Failed to access microphone');
      return null;
    }
  };

  const getCameraStream = async (facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: facingMode
        },
        audio: false
      });
      return stream;
    } catch (err) {
      console.error('Error getting camera stream:', err);
      setError('Failed to access camera');
      return null;
    }
  };

  const combineStreams = (streams: MediaStream[]): MediaStream => {
    const combinedStream = new MediaStream();
    
    streams.forEach(stream => {
      stream.getTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
    });
    
    return combinedStream;
  };

  const startRecording = useCallback(async () => {
    setError(null);
    const streams: MediaStream[] = [];

    try {
      // Get screen stream if enabled
      if (isScreenRecording) {
        const screenStream = await getScreenStream();
        if (screenStream) {
          screenStreamRef.current = screenStream;
          streams.push(screenStream);
        }
      }

      // Get audio stream if enabled
      if (isVoiceRecording) {
        const audioStream = await getAudioStream();
        if (audioStream) {
          audioStreamRef.current = audioStream;
          streams.push(audioStream);
        }
      }

      // Get camera stream if enabled
      if (isCameraRecording) {
        const videoStream = await getCameraStream(cameraFacingMode);
        if (videoStream) {
          setCameraStream(videoStream);
          streams.push(videoStream);
        }
      }

      if (streams.length === 0) {
        setError('No recording sources enabled');
        return;
      }

      // Combine all streams
      const combinedStream = combineStreams(streams);
      combinedStreamRef.current = combinedStream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9,opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setIsRecording(false);
        stopTimer();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      startTimer();

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  }, [isScreenRecording, isVoiceRecording, isCameraRecording, cameraFacingMode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all streams
      [screenStreamRef.current, audioStreamRef.current, combinedStreamRef.current, cameraStream].forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });

      // Clear camera stream
      setCameraStream(null);
    }
  }, [isRecording, cameraStream]);

  const toggleScreen = useCallback(() => {
    setIsScreenRecording(prev => !prev);
  }, []);

  const toggleVoice = useCallback(() => {
    setIsVoiceRecording(prev => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraRecording(prev => !prev);
    if (isCameraRecording && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [isCameraRecording, cameraStream]);

  const toggleCameraFacingMode = useCallback(async () => {
    const newFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(newFacingMode);
    
    // If camera is currently active, update the stream with the new facing mode
    if (isCameraRecording && !isRecording) {
      // Stop current camera stream if it exists
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      
      // Get new camera stream with updated facing mode
      try {
        const newCameraStream = await getCameraStream(newFacingMode);
        if (newCameraStream) {
          setCameraStream(newCameraStream);
        }
      } catch (err) {
        console.error('Error switching camera:', err);
        setError('Failed to switch camera');
      }
    }
  }, [cameraFacingMode, isCameraRecording, isRecording, cameraStream]);

  return {
    isRecording,
    isScreenRecording,
    isVoiceRecording,
    isCameraRecording,
    recordingTime,
    startRecording,
    stopRecording,
    toggleScreen,
    toggleVoice,
    toggleCamera,
    toggleCameraFacingMode,
    recordedBlob,
    cameraStream,
    error,
    cameraFacingMode
  };
};