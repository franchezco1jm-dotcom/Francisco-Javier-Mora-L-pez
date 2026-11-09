/**
 * Unified Media Permissions Manager
 * Requests camera and microphone permissions ONCE in a single unified prompt,
 * and caches the approval so the browser never prompts repeatedly.
 */

export interface PermissionStatus {
  camera: 'granted' | 'prompt' | 'denied' | 'unsupported';
  microphone: 'granted' | 'prompt' | 'denied' | 'unsupported';
  allGranted: boolean;
}

const PERMISSIONS_KEY = 'inventory_permissions_granted_v2';
const PREFERRED_CAMERA_KEY = 'inventory_preferred_camera_id';

/**
 * Checks current permission states via navigator.permissions or localStorage cache
 */
export async function checkMediaPermissions(): Promise<PermissionStatus> {
  const result: PermissionStatus = {
    camera: 'prompt',
    microphone: 'prompt',
    allGranted: false,
  };

  if (typeof window === 'undefined' || !navigator.mediaDevices) {
    result.camera = 'unsupported';
    result.microphone = 'unsupported';
    return result;
  }

  // Fast check from localStorage
  const cached = localStorage.getItem(PERMISSIONS_KEY) === 'true';

  try {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const camStatus = await navigator.permissions.query({ name: 'camera' as any });
        result.camera = camStatus.state as any;
      } catch {
        // Fallback to cached if permission name not supported
        if (cached) result.camera = 'granted';
      }

      try {
        const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
        result.microphone = micStatus.state as any;
      } catch {
        // Fallback to cached if permission name not supported
        if (cached) result.microphone = 'granted';
      }
    } else if (cached) {
      result.camera = 'granted';
      result.microphone = 'granted';
    }
  } catch {
    if (cached) {
      result.camera = 'granted';
      result.microphone = 'granted';
    }
  }

  result.allGranted = result.camera === 'granted' && result.microphone === 'granted';
  return result;
}

/**
 * Requests camera AND microphone together in a single browser prompt.
 * Immediately stops all media tracks once granted to save battery and memory.
 */
export async function requestUnifiedPermissions(): Promise<{
  success: boolean;
  camera: boolean;
  microphone: boolean;
  error?: string;
}> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      success: false,
      camera: false,
      microphone: false,
      error: 'Tu navegador no soporta acceso a dispositivos multimedia.',
    };
  }

  let cameraOk = false;
  let micOk = false;

  // 1. Try unified request (both camera and microphone together in ONE dialog)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: true,
    });

    cameraOk = stream.getVideoTracks().length > 0;
    micOk = stream.getAudioTracks().length > 0;

    // Detect back camera deviceId for fast future startup without camera dialogs
    try {
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings?.();
      if (settings?.deviceId) {
        localStorage.setItem(PREFERRED_CAMERA_KEY, settings.deviceId);
      }
    } catch {
      // ignore
    }

    // Immediately stop all tracks to turn off camera and mic indicators
    stream.getTracks().forEach((track) => track.stop());

    localStorage.setItem(PERMISSIONS_KEY, 'true');
    return { success: true, camera: cameraOk, microphone: micOk };
  } catch (err: any) {
    console.warn('Unified camera+mic request did not succeed together, trying camera fallback:', err);
  }

  // 2. Fallback: try camera alone if microphone was denied or absent (e.g. desktop without mic)
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    });
    cameraOk = videoStream.getVideoTracks().length > 0;
    videoStream.getTracks().forEach((t) => t.stop());
    localStorage.setItem(PERMISSIONS_KEY, 'true');
  } catch {
    cameraOk = false;
  }

  // 3. Try microphone alone if camera failed
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    micOk = audioStream.getAudioTracks().length > 0;
    audioStream.getTracks().forEach((t) => t.stop());
  } catch {
    micOk = false;
  }

  return {
    success: cameraOk || micOk,
    camera: cameraOk,
    microphone: micOk,
    error: !cameraOk && !micOk ? 'No se concedieron los permisos solicitados.' : undefined,
  };
}

/**
 * Returns saved preferred camera device ID, if known
 */
export function getSavedCameraId(): string | null {
  try {
    return localStorage.getItem(PREFERRED_CAMERA_KEY);
  } catch {
    return null;
  }
}
