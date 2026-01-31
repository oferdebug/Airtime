'use client';

import { FileAudio, Upload } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone';
import { MAX_FILE_SIZE } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Upload dropzone — drag-and-drop or click-to-browse with validation.
 *
 * - **Interaction**: Drag & drop or click to open file picker
 * - **Validation**: Audio MIME types only, enforced file size limit
 * - **Feedback**: Drag state, accept/reject styling, error messages
 * - **A11y**: Proper label, focus, and keyboard-friendly file input
 *
 * **Supported formats**: MP3, M4A, WAV, AAC, FLAC, OGG, Opus, WebM, 3GP, 3G2
 * (Multiple MIME variants per format for Chrome, Firefox, Safari consistency.)
 */


const ACCEPT_AUDIO: Accept = {
  'audio/mpeg': ['.mp3'],
  'audio/mp3': ['.mp3'],
  'audio/mp4': ['.m4a', '.mp4'],
  'audio/m4a': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
  'audio/wav': ['.wav', '.wave'],
  'audio/x-wav': ['.wav', '.wave'],
  'audio/wave': ['.wav', '.wave'],
  'audio/aac': ['.aac'],
  'audio/aacp': ['.aac'],
  'audio/ogg': ['.ogg', '.oga'],
  'audio/opus': ['.opus'],
  'audio/webm': ['.webm'],
  'audio/flac': ['.flac'],
  'audio/x-flac': ['.flac'],
  'audio/3gpp': ['.3gp'],
  'audio/3gpp2': ['.3g2'],
};

function formatfileSize(bytes:number):string {
    if(bytes < 1024) return `${bytes}B`;
    if(bytes <1024*1024) return `${(bytes/1024).toFixed(1)}KB`;
    return `${(bytes/(1024*1024)).toFixed(1)}MB`;
}

const DROPZONE_ID='upload-dropzone';
const DROPZONE_LABEL_ID='upload-dropzone-label';
const DROPZONE_DESC_ID='upload-dropzone-desc';

interface UploadDropzoneProps {
    onFileSelect:(file:File)=>void;
    disabled?:boolean;
    maxSize?:number;
    onReject?: (rejections: FileRejection[]) => void;
}

export function UploadDropzone({
  onFileSelect,
  disabled = false,
  maxSize = MAX_FILE_SIZE,
  onReject,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
);

const onDropRejected = useCallback(
  (rejections: FileRejection[]) => {
    onReject?.(rejections);
  },
  [onReject],
);


const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
}=useDropzone({
    onDrop,
    onDropRejected: onReject ? onDropRejected : undefined,
    accept:ACCEPT_AUDIO,
    maxSize,
    maxFiles:1,
    disabled,
    noKeyboard: false,
});

const errorMessage=fileRejections?.[0]?.errors?.[0]?.message;
const hasError=Boolean(errorMessage);


return (
    <div className={'w-full'} id={DROPZONE_ID}>
        <div
        {...getRootProps({
            'aria-describedby':DROPZONE_DESC_ID,
            'aria-invalid':hasError,
            'aria-labelledby':DROPZONE_LABEL_ID,
        })}
        className={cn(
            'relative rounded-2xl border-2 border-dashed p-8 text-center transition-all outline-none',
          'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          'border-emerald-300 bg-emerald-50/30 hover:border-emerald-500 hover:bg-emerald-50/50',
          isDragActive&&
          !isDragReject&&
            'border-emerald-600 bg-emerald-100/80 scale-[1.01] shadow-lg',
            isDragReject&&'border-red-600 bg-red-50/50',
            disabled&&'cursor-not-allowed opacity-60',
            hasError&&'border-red-600 bg-red-50/30',
            !disabled&&'cursor-pointer'
        )}
        >
            <input
            {...getInputProps()}
            id={`${DROPZONE_ID}-input`}
            aria-labelledby={DROPZONE_DESC_ID}
            />
            <div className={'flex flex-col items-center gap-3'}>
                {isDragActive ? (
                    isDragReject ? (
                        <FileAudio className="h-12 w-12 text-red-500" aria-hidden />
                    ) : (
                        <Upload className="h-12 w-12 text-emerald-500" aria-hidden />
                    )
                ) : (
                    <Upload className="h-12 w-12 text-emerald-500" aria-hidden />
                )}
                <p
                    id={DROPZONE_LABEL_ID}
                    className={'text-base font-medium text-stone-800'}
                    >
                        {isDragActive
                        ?isDragReject
                        ?'Wrong Format Or Too Large File'
                        :'Drop Your Audio File Here'
                        :'Drag&Drop Your Audio File,Or Click To Browse Your Files'}
                    </p>
                    <p
                    id={DROPZONE_DESC_ID}
                    className={'text-sm text-stone-500'}
                    >
                        {formatfileSize(maxSize)}  max · MP3, M4A, WAV, AAC, FLAC, OGG, Opus, WebM, 3GP 
                    </p>
                </div>
        </div>
        {errorMessage && (
            <p
                className="mt-3 text-sm text-red-700"
                role="alert"
                id={`${DROPZONE_ID}-error-message`}
            >
                {errorMessage}
            </p>
        )}
    </div>
  );
}

export default UploadDropzone;