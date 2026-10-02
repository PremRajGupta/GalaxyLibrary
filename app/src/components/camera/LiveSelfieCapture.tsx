import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check } from 'lucide-react';

interface LiveSelfieCaptureProps {
  onCapture: (base64Image: string) => void;
}

export default function LiveSelfieCapture({ onCapture }: LiveSelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError('Camera access denied or not available. Please allow camera access.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Clean up on unmount and attach stream when it becomes available
  React.useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      stopCamera();
    };
  }, [stream, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image onto canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 jpeg, slightly compressed (0.8) to save bandwidth
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
        onCapture(imageDataUrl);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg w-full text-center">
          {error}
        </div>
      )}

      {!stream && !capturedImage && !error && (
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <Camera size={20} />
          <span>Open Camera for Selfie</span>
        </button>
      )}

      {/* Video Stream */}
      <div className={`relative rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 ${!stream && !capturedImage ? 'hidden' : 'block'}`}>
        {stream && !capturedImage && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-sm h-auto object-cover aspect-[3/4]"
            />
            <button
              type="button"
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-800 p-4 rounded-full shadow-xl hover:bg-slate-50 transition-transform active:scale-95"
            >
              <Camera size={28} />
            </button>
          </>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="relative group">
            <img 
              src={capturedImage} 
              alt="Selfie preview" 
              className="w-full max-w-sm h-auto object-cover aspect-[3/4]"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
              <button
                type="button"
                onClick={retakePhoto}
                className="bg-white text-slate-800 p-3 rounded-full hover:bg-slate-100 shadow-lg"
                title="Retake"
              >
                <RefreshCw size={24} />
              </button>
              <button
                type="button"
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 shadow-lg"
                title="Looks Good"
              >
                <Check size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for capturing the image */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
