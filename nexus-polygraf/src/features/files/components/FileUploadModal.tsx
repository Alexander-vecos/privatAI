import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../../stores/uiStore';
import { useFileStore } from '../../../stores/fileStore';
import { useAuthStore } from '../../../stores/authStore';
import { firestoreAdapter } from '../../../firebase/firestoreAdapter';
import {
  FaCloudUploadAlt,
  FaTimes,
  FaFile,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../../../utils/constants';

interface UploadItem {
  file: File;
  status: 'pending' | 'reading' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

const readFileAsBase64 = (
  file: File,
  onProgress: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 50);
        onProgress(percent);
      }
    };

    reader.onload = () => {
      const result = reader.result as string;
      onProgress(50);
      resolve(result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Modal for uploading files to Firestore as Base64
 */
export const FileUploadModal: React.FC = () => {
  const { activeModal, closeModal } = useUIStore();
  const { startUpload, completeUpload, setError: setFileError } = useFileStore();
  const { user } = useAuthStore();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isVisible = activeModal === 'fileUpload';

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not allowed`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit`;
    }

    return null;
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;

    const newUploads: UploadItem[] = [];

    Array.from(files).forEach((file) => {
      const validationError = validateFile(file);

      if (validationError) {
        newUploads.push({
          file,
          status: 'error',
          progress: 0,
          error: validationError,
        });
      } else {
        newUploads.push({
          file,
          status: 'pending',
          progress: 0,
        });
      }
    });

    setUploads((prev) => [...prev, ...newUploads]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploads((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    handleFilesAdded(event.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!user || uploads.length === 0) return;

    startUpload();

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i];

      if (upload.status === 'done' || upload.status === 'error') {
        continue;
      }

      try {
        // Read file to Base64
        setUploads((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'reading', progress: 0 } : item
          )
        );

        const base64 = await readFileAsBase64(upload.file, (progress) => {
          setUploads((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, progress } : item
            )
          );
        });

        // Upload to Firestore
        setUploads((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'uploading', progress: 50 } : item
          )
        );

        await firestoreAdapter.addFile({
          name: upload.file.name,
          type: upload.file.type,
          size: upload.file.size,
          base64: base64,
          uploadedBy: user.uid,
        });

        setUploads((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'done', progress: 100 } : item
          )
        );
      } catch (err: any) {
        console.error('Upload error:', err);
        setUploads((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'error', error: err.message || 'Upload failed' }
              : item
          )
        );
      }
    }

    completeUpload();
  };

  const handleClose = () => {
    setUploads([]);
    closeModal();
  };

  if (!isVisible) return null;

  const hasErrorItems = uploads.some((u) => u.status === 'error');
  const hasPendingItems = uploads.some((u) => u.status === 'pending' || u.status === 'reading' || u.status === 'uploading');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Upload Files
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <FaTimes className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Drop Zone */}
            {uploads.length === 0 && (
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <FaCloudUploadAlt className="mx-auto mb-3 text-4xl text-gray-400" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Drag files here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Max 5MB per file. Supported formats: PDF, SVG, ZIP, JPG, PNG, and more
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_MIME_TYPES.join(',')}
                  onChange={(e) => handleFilesAdded(e.currentTarget.files)}
                  className="hidden"
                />
              </motion.div>
            )}

            {/* Files List */}
            {uploads.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {uploads.map((upload, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <FaFile className="text-gray-400 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(upload.file.size / 1024).toFixed(2)} KB
                      </p>

                      {/* Progress Bar */}
                      {(upload.status === 'reading' || upload.status === 'uploading') && (
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${upload.progress}%` }}
                            className="h-full bg-blue-500 rounded-full"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {upload.status === 'done' && (
                        <FaCheckCircle className="text-green-500 text-lg" />
                      )}
                      {upload.status === 'error' && (
                        <FaExclamationTriangle className="text-red-500 text-lg" />
                      )}
                      {(upload.status === 'pending' ||
                        upload.status === 'reading' ||
                        upload.status === 'uploading') && (
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Error Messages */}
            {hasErrorItems && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-600 dark:text-red-400">
                  Some files have errors. Please review and try again.
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            {uploads.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!hasPendingItems}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Upload {uploads.filter((u) => u.status !== 'error').length} file(s)
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
