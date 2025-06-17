import React from 'react';
import { Play, Square, Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff, FlipHorizontal } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  isScreenRecording: boolean;
  isVoiceRecording: boolean;
  isCameraRecording: boolean;
  cameraFacingMode?: 'user' | 'environment';
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleScreen: () => void;
  onToggleVoice: () => void;
  onToggleCamera: () => void;
  onToggleCameraFacingMode?: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isScreenRecording,
  isVoiceRecording,
  isCameraRecording,
  cameraFacingMode = 'user',
  onStartRecording,
  onStopRecording,
  onToggleScreen,
  onToggleVoice,
  onToggleCamera,
  onToggleCameraFacingMode
}) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Screen Recording Toggle */}
      <button
        onClick={onToggleScreen}
        className={`p-2 rounded transition-colors ${
          isScreenRecording 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-gray-600'
        }`}
        title={isScreenRecording ? "Disable screen recording" : "Enable screen recording"}
      >
        {isScreenRecording ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
      </button>

      {/* Voice Recording Toggle */}
      <button
        onClick={onToggleVoice}
        className={`p-2 rounded transition-colors ${
          isVoiceRecording 
            ? 'bg-green-600 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-gray-600'
        }`}
        title={isVoiceRecording ? "Disable voice recording" : "Enable voice recording"}
      >
        {isVoiceRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </button>

      {/* Camera Recording Toggle */}
      <button
        onClick={onToggleCamera}
        className={`p-2 rounded transition-colors ${
          isCameraRecording 
            ? 'bg-purple-600 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-gray-600'
        }`}
        title={isCameraRecording ? "Disable camera recording" : "Enable camera recording"}
      >
        {isCameraRecording ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
      </button>

      {/* Camera Facing Mode Toggle */}
      {isCameraRecording && onToggleCameraFacingMode && (
        <button
          onClick={onToggleCameraFacingMode}
          className="p-2 bg-purple-600 text-white rounded transition-colors"
          title={`Switch to ${cameraFacingMode === 'user' ? 'back' : 'front'} camera`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
      )}

      {/* Start/Stop Recording */}
      <div className="w-px h-6 bg-gray-600 mx-2"></div>
      
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={!isScreenRecording && !isVoiceRecording && !isCameraRecording}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white'
        }`}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Record</span>
          </>
        )}
      </button>
    </div>
  );
};

export default RecordingControls;