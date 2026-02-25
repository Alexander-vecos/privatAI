/**
 * Декодировать Base64 Data URL в текст
 */
export function decodeBase64(dataUrl: string): string {
  try {
    // Extract base64 part from data URL
    const base64Part = dataUrl.split(',')[1];
    if (!base64Part) {
      return dataUrl; // Return as-is if not a data URL
    }

    // Decode base64 to binary string
    const binaryString = atob(base64Part);

    // Convert binary string to UTF-8
    return decodeURIComponent(
      Array.prototype.map
        .call(binaryString, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
}

/**
 * Получить MIME тип из Base64 Data URL
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+)/);
  return match ? match[1] : 'application/octet-stream';
}

/**
 * Проверить, является ли контент текстовым (для предпросмотра)
 */
export function isTextContent(mimeType: string): boolean {
  const textMimeTypes = [
    'text/',
    'application/json',
    'application/xml',
    'application/x-xml',
    'application/javascript',
    'application/x-javascript',
    'application/typescript',
    'text/javascript',
    'text/xml',
  ];

  return textMimeTypes.some((type) => mimeType.includes(type));
}

/**
 * Проверить, является ли контент изображением
 */
export function isImageContent(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Проверить, является ли контент PDF
 */
export function isPdfContent(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

/**
 * Проверить, можно ли предпросмотреть файл в браузере
 */
export function isPreviewable(mimeType: string): boolean {
  const previewableMimes = [
    /^image\//,
    /^text\//,
    'application/pdf',
    'application/json',
    'application/xml',
    'application/x-xml',
    'application/javascript',
    'application/x-javascript',
  ];

  return previewableMimes.some((mime) =>
    mime instanceof RegExp ? mime.test(mimeType) : mimeType === mime
  );
}
