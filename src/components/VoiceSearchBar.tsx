import React, { useState } from 'react';
import { Search, Mic, MicOff, Barcode, X, Volume2, Sparkles } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

interface VoiceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onScanClick: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
  placeholder?: string;
}

export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  value,
  onChange,
  onScanClick,
  onToast,
  placeholder = 'Buscar por nombre o código...',
}) => {
  const [liveTranscript, setLiveTranscript] = useState('');

  const {
    isSupported,
    isListening,
    toggleListening,
    stopListening,
  } = useVoiceSearch({
    lang: 'es-ES',
    onResult: (transcript, isFinal) => {
      setLiveTranscript(transcript);
      onChange(transcript);
      if (isFinal) {
        onToast(`Búsqueda por voz: "${transcript}"`);
        setLiveTranscript('');
      }
    },
    onError: (errMessage) => {
      onToast(errMessage, 'error');
      setLiveTranscript('');
    },
  });

  const handleMicClick = () => {
    if (!isSupported) {
      onToast(
        'La búsqueda por voz no está soportada en este navegador. Te recomendamos usar Google Chrome, Safari o Microsoft Edge.',
        'error'
      );
      return;
    }
    toggleListening();
  };

  const handleClear = () => {
    onChange('');
    setLiveTranscript('');
    if (isListening) {
      stopListening();
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative flex items-center">
        {/* Left Search Icon */}
        <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isListening ? 'Escuchando tu voz...' : placeholder}
          className={`w-full pl-10 pr-24 py-2.5 rounded-2xl text-sm text-slate-100 placeholder-slate-400 transition-all shadow-sm focus:outline-none ${
            isListening
              ? 'bg-purple-950/40 border-2 border-purple-500 ring-2 ring-purple-500/30'
              : 'bg-slate-800/90 border border-slate-700 focus:ring-2 focus:ring-purple-500'
          }`}
        />

        {/* Action Buttons inside Input */}
        <div className="absolute right-2 flex items-center gap-1">
          {/* Clear text button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Borrar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Voice Search Button (Web Speech API) */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-1.5 rounded-xl border transition-all duration-200 relative flex items-center justify-center ${
              isListening
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/50 animate-pulse'
                : 'text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/30'
            }`}
            title={
              isListening
                ? 'Detener búsqueda por voz'
                : isSupported
                ? 'Buscar por voz (Web Speech API)'
                : 'Búsqueda por voz no compatible con este navegador'
            }
            aria-label="Búsqueda por voz"
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4" />
            )}

            {/* Pulsing ring when listening */}
            {isListening && (
              <span className="absolute -inset-1 rounded-xl bg-rose-500/40 animate-ping pointer-events-none" />
            )}
          </button>

          {/* Barcode Scanner Button */}
          <button
            type="button"
            onClick={onScanClick}
            className="p-1.5 text-purple-400 hover:text-purple-300 bg-purple-600/20 hover:bg-purple-600/30 rounded-xl border border-purple-500/30 transition"
            title="Escanear código de barras con cámara"
            aria-label="Escanear código de barras"
          >
            <Barcode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Listening Banner */}
      {isListening && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-purple-900/70 via-slate-900 to-purple-900/70 border border-purple-500/50 rounded-2xl shadow-lg shadow-purple-950/60 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Animated Soundwave bars */}
            <div className="flex items-end gap-0.5 h-4 shrink-0">
              <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
              <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
              <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-2" />
              <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.25s] h-3.5" />
            </div>

            <div className="truncate">
              <span className="font-bold text-purple-200">Escuchando... </span>
              {liveTranscript ? (
                <span className="text-white font-medium italic">"{liveTranscript}"</span>
              ) : (
                <span className="text-purple-300/80">Di el nombre o código del producto...</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={stopListening}
            className="ml-2 px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-[10px] shrink-0 transition shadow-sm"
          >
            Detener
          </button>
        </div>
      )}
    </div>
  );
};
