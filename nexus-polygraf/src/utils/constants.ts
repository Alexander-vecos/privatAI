export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/svg+xml',
  'application/zip',
  'application/x-rar-compressed',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.corel-draw',
  'text/plain',
  'application/json',
  'application/xml',
  'text/xml',
  'application/javascript',
  'text/javascript',
  'text/css',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export const ANIMATION_DURATION = 300; // milliseconds
