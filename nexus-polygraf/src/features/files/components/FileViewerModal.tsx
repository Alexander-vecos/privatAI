import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDownload, FaSpinner } from 'react-icons/fa';
import { useUIStore } from '../../../stores/uiStore';
import { firestoreAdapter, FileData } from '../../../firebase/firestoreAdapter';
import {
  isImageContent,
  isPdfContent,
  isTextContent,
  decodeBase64,
  getMimeTypeFromDataUrl,
} from '../../../utils/base64Decoder';
// @ts-ignore
import { Highlight, themes } from 'prism-react-renderer';

/**
 * Modal for viewing files with format-specific rendering
 */
export const FileViewerModal: React.FC = () => {
  const { activeModal, viewingFileId, closeModal } = useUIStore();
  const [file, setFile] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVisible = activeModal === 'fileViewer' && !!viewingFileId;

  useEffect(() => {
    if (!isVisible || !viewingFileId) return;

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedFile = await firestoreAdapter.getFile(viewingFileId);
        if (!loadedFile) {
          throw new Error('File not found');
        }
        setFile(loadedFile);
      } catch (err: any) {
        setError(err.message || 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [isVisible, viewingFileId]);

  const handleDownload = () => {
    if (!file) return;

    try {
      const link = document.createElement('a');
      link.href = file.base64;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file');
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {isLoading ? 'Loading...' : file?.name || 'File Viewer'}
              </h2>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {file && (
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Download file"
                >
                  <FaDownload className="text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <FaSpinner className="text-4xl text-gray-400 animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400 text-lg font-medium">
                    {error}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try downloading the file instead
                  </p>
                </div>
              </div>
            )}

            {!isLoading && !error && file && (
              <ViewerContent file={file} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * Render file content based on type
 */
function ViewerContent({ file }: { file: FileData }) {
  const mimeType = getMimeTypeFromDataUrl(file.base64) || file.type;

  // Images
  if (isImageContent(mimeType)) {
    return (
      <div className="flex items-center justify-center">
        <img
          src={file.base64}
          alt={file.name}
          className="max-w-full max-h-[70vh] object-contain"
        />
      </div>
    );
  }

  // PDF - Open in new tab or iframe
  if (isPdfContent(mimeType)) {
    return (
      <iframe
        src={file.base64}
        className="w-full h-full min-h-[70vh]"
        title={file.name}
      />
    );
  }

  // Text content with syntax highlighting
  if (isTextContent(mimeType)) {
    const text = decodeBase64(file.base64);

    if (!text) {
      return (
        <div className="text-center text-red-500">
          Failed to decode text content
        </div>
      );
    }

    return (
      <CodeViewer
        code={text}
        language={getLanguageFromMimeType(mimeType)}
        filename={file.name}
      />
    );
  }

  // Default message for unsupported types
  return (
    <div className="text-center text-gray-500 dark:text-gray-400">
      <p className="text-lg font-medium">Preview not available</p>
      <p className="text-sm mt-2">
        File type &quot;{mimeType}&quot; cannot be previewed in browser
      </p>
    </div>
  );
}

/**
 * Code viewer with syntax highlighting
 */
function CodeViewer({
  code,
  language = 'text',
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  return (
    <div className="bg-gray-950 rounded-lg overflow-hidden">
      {filename && (
        <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400 font-mono">
          {filename}
        </div>
      )}
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }: any) => (
          <pre
            className="overflow-auto p-4 text-sm"
            style={style}
          >
            {tokens.map((line: any, i: number) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                <span className="text-gray-600 mr-4 select-none">
                  {(i + 1).toString().padStart(3, ' ')}
                </span>
                {line.map((token: any, key: number) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

/**
 * Get programming language from MIME type
 */
function getLanguageFromMimeType(mimeType: string): string {
  const languageMap: Record<string, string> = {
    'application/json': 'json',
    'application/javascript': 'javascript',
    'text/javascript': 'javascript',
    'application/x-javascript': 'javascript',
    'application/typescript': 'typescript',
    'text/typescript': 'typescript',
    'text/xml': 'xml',
    'application/xml': 'xml',
    'application/x-xml': 'xml',
    'text/html': 'html',
    'text/css': 'css',
    'text/plain': 'text',
  };

  return languageMap[mimeType] || 'text';
}
