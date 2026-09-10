import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { PortalModal } from './PortalModal';

interface CameraCaptureModalProps {
  title?: string;
  description?: string;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const PRESET_SAMPLE_PHOTOS = [
  {
    label: 'Expired Blister Strip',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Packaging Batch Stamp',
    url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Damaged Shipper Box',
    url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
  },
];

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  title = 'Capture Medicine Photo',
  description = 'Point camera at the medicine blister, strip, or packaging',
  onCapture,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Start Camera
  const startCamera = async (mode: 'environment' | 'user') => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (navigator.mediaDevices.getUserMedia) is not supported on this device/browser.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback without constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      console.warn('Camera access failed:', msg);
      setCameraError(msg);
      setHasCamera(false);
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Take snapshot
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add optional statutory timestamp overlay
    const timestamp = new Date().toLocaleString();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, canvas.height - 35, 380, 25);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(`CDSCO AUDIT: ${timestamp}`, 16, canvas.height - 18);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(dataUrl);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setCapturedPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setCapturedPhoto(url);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <PortalModal
      id="camera-capture-modal"
      onClose={onClose}
      className="bg-white dark:bg-[#071914] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-teal-900/60 overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-teal-950 text-white p-4 flex items-center justify-between border-b border-teal-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{title}</h3>
              <p className="text-[11px] text-teal-300/80 leading-tight">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
            {capturedPhoto ? (
              // Snapshot preview
              <img
                src={capturedPhoto}
                alt="Captured Snapshot"
                className="w-full h-full object-contain bg-black"
              />
            ) : hasCamera ? (
              // Live camera stream
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Reticle / Optical Target Frame */}
                <div className="absolute inset-4 border border-dashed border-teal-400/60 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-teal-400 absolute top-0 left-0"></div>
                  <div className="w-8 h-8 border-t-2 border-r-2 border-teal-400 absolute top-0 right-0"></div>
                  <div className="w-8 h-8 border-b-2 border-l-2 border-teal-400 absolute bottom-0 left-0"></div>
                  <div className="w-8 h-8 border-b-2 border-r-2 border-teal-400 absolute bottom-0 right-0"></div>
                </div>

                {cameraLoading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-teal-400 mr-2" />
                    Initializing camera stream...
                  </div>
                )}
              </>
            ) : (
              // Camera error / not allowed fallback
              <div className="p-5 text-center text-slate-300 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs font-semibold text-white">Live Camera Unavailable or Blocked</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {cameraError || 'Please allow camera permissions, or upload a photo / use a sample photo below.'}
                </p>
              </div>
            )}
          </div>

          {/* Action Controls */}
          {capturedPhoto ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-200 hover:bg-slate-100 dark:hover:bg-teal-900/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {hasCamera && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-2 rounded-lg border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/50 text-xs transition-colors"
                    title="Switch Camera (Front / Back)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              )}

              {/* Alternative Options: Device Upload & Presets */}
              <div className="pt-2 border-t border-slate-200 dark:border-teal-900/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-teal-300/70">
                  <span>Or use file upload / sample:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer py-1.5 px-3 rounded-lg border border-dashed border-teal-600 dark:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {PRESET_SAMPLE_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-[#0c2e25] hover:bg-slate-200 dark:hover:bg-teal-900/60 text-slate-700 dark:text-teal-200 text-[11px] font-medium transition-colors flex items-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalModal>
  );
};
