import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, RefreshCw, AlertTriangle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setHasCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsLoading(true);
    setHasCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Camera access error:', err);
      // Fallback without width/height ideal constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setIsLoading(false);
      } catch (fallbackErr) {
        setHasCameraError('No se pudo acceder a la cámara. Revisa los permisos de tu navegador.');
        setIsLoading(false);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const targetWidth = Math.min(video.videoWidth || 800, 1024);
    const scale = targetWidth / (video.videoWidth || 800);
    const targetHeight = Math.round((video.videoHeight || 600) * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[85] flex flex-col justify-between">
      {/* Top Header */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md flex justify-between items-center text-white z-10">
        <span className="font-bold text-sm flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          <span>{capturedPhoto ? 'Revisar Foto' : 'Tomar Foto del Producto'}</span>
        </span>
        <button
          onClick={handleClose}
          className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {capturedPhoto ? (
          /* Preview of captured photo */
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={capturedPhoto}
              alt="Foto capturada"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          /* Live camera stream */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {isLoading && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-xs">Abriendo cámara...</p>
              </div>
            )}

            {hasCameraError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-rose-400 mb-3" />
                <p className="text-sm font-semibold text-rose-200 mb-4">{hasCameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            {/* Viewfinder Framing Guidelines */}
            {!isLoading && !hasCameraError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-72 h-72 border-2 border-white/40 rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-6 bg-slate-950/90 backdrop-blur-md flex items-center justify-around z-10">
        {capturedPhoto ? (
          /* Controls after photo is taken */
          <div className="w-full flex items-center justify-center gap-6">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Tomar Otra</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/40 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Usar Esta Foto</span>
            </button>
          </div>
        ) : (
          /* Controls before photo is taken */
          <div className="w-full flex items-center justify-around">
            <button
              onClick={toggleFacingMode}
              className="p-3 text-slate-300 bg-slate-800/80 rounded-2xl border border-slate-700 active:scale-90 transition"
              title="Cambiar cámara"
            >
              <RefreshCw className="w-5 h-5 text-indigo-400" />
            </button>

            {/* Shutter Button */}
            <button
              onClick={takePhoto}
              disabled={isLoading || !!hasCameraError}
              className="w-18 h-18 rounded-full border-4 border-white bg-indigo-600 active:scale-90 transition flex items-center justify-center shadow-2xl shadow-indigo-600/60 disabled:opacity-50"
              aria-label="Disparador"
            >
              <div className="w-13 h-13 rounded-full bg-white flex items-center justify-center">
                <Camera className="w-6 h-6 text-indigo-600" />
              </div>
            </button>

            <button
              onClick={handleClose}
              className="p-3 text-slate-300 bg-slate-800/80 rounded-2xl border border-slate-700 active:scale-90 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
