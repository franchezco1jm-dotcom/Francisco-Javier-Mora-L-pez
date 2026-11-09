import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface UseVoiceSearchOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const { lang = 'es-ES', onResult, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      const msg = 'Tu navegador no soporta búsqueda por voz (Web Speech API).';
      setError(msg);
      onError?.(msg);
      return;
    }

    // If currently listening, stop first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Haptic feedback if supported
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([30, 20, 30]);
        } catch {
          // ignore
        }
      }

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        try {
          localStorage.setItem('inventory_permissions_granted_v2', 'true');
        } catch {
          // ignore
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          currentTranscript += text;
          if (item.isFinal) {
            isFinal = true;
          }
        }

        const cleaned = currentTranscript.trim().replace(/\.+$/, '');
        setTranscript(cleaned);
        onResult?.(cleaned, isFinal);
      };

      recognition.onerror = (event: any) => {
        let message = 'Error en reconocimiento de voz.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          message = 'Permiso de micrófono denegado. Habilita el acceso al micrófono.';
        } else if (event.error === 'no-speech') {
          message = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
        } else if (event.error === 'audio-capture') {
          message = 'No se encontró ningún micrófono disponible.';
        } else if (event.error === 'network') {
          message = 'Error de conexión para el reconocimiento de voz.';
        }

        setError(message);
        setIsListening(false);
        onError?.(message);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start error:', err);
      const msg = 'No se pudo iniciar el micrófono.';
      setError(msg);
      setIsListening(false);
      onError?.(msg);
    }
  }, [lang, onError, onResult]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
