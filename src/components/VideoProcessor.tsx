
import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload } from 'lucide-react';

interface VideoProcessorProps {
  videoBlob: Blob;
  code?: string;
  language?: string;
  onCreatePost: () => void;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({
  videoBlob,
  code = '',
  language = 'javascript',
  onCreatePost
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState('high');
  const [format, setFormat] = useState('mp4');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoBlob]);

  const downloadVideo = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `coding-session-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const compressVideo = async () => {
    setIsProcessing(true);
    
    // Simulate video compression process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
  };

  return (
    <div className="border-t border-gray-600 bg-gray-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recording Complete</h3>
          <div className="flex items-center space-x-2">
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            >
              <option value="high">High Quality</option>
              <option value="medium">Medium Quality</option>
              <option value="low">Low Quality</option>
            </select>
            
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            >
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="mov">MOV</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Video Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Video Preview</label>
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-48 bg-gray-900 rounded border border-gray-600"
              />
            )}
            
            <div className="mt-2 text-sm text-gray-400">
              <p>Size: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Format: {videoBlob.type}</p>
            </div>
          </div>

          {/* Code Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Code Snippet</label>
            <div className="h-48 bg-gray-900 rounded border border-gray-600 p-3 overflow-auto">
              <pre className="text-sm text-gray-100 font-mono">
                <code>{code && code.length > 500 ? `${code.slice(0, 500)}...` : code}</code>
              </pre>
            </div>
            
            <div className="mt-2 text-sm text-gray-400">
              <p>Language: {language}</p>
              <p>Lines: {code ? code.split('\n').length : 0}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            onClick={compressVideo}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isProcessing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isProcessing ? 'Compressing...' : 'Compress'}</span>
          </button>
          
          <button
            onClick={downloadVideo}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          
          <button
            onClick={onCreatePost}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Share as Post</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoProcessor;