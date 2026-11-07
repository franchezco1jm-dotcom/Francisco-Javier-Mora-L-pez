/**
 * Utility function for sharing content via Web Share API or Clipboard fallback
 */
export async function shareContent(
  title?: string,
  text?: string,
  url?: string,
  onToast?: (msg: string, type?: 'success' | 'error') => void
): Promise<boolean> {
  const shareTitle = title || 'Blackberry Inventory';
  const shareText = text || 'Revisa este catálogo o producto en tiempo real:';
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Verifica si el navegador móvil soporta la API nativa de compartir
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      if (onToast) onToast('Contenido compartido con éxito');
      return true;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error al compartir:', error);
      }
      return false;
    }
  } else {
    // Alternativa para navegadores de escritorio: copiar al portapapeles
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        const fullShare = `${shareText}\n${shareUrl}`;
        await navigator.clipboard.writeText(fullShare);
        if (onToast) onToast('Enlace copiado al portapapeles para compartir');
        return true;
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  }
}
