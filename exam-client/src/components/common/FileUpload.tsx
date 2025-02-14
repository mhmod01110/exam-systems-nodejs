import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { submissionService } from '@/services/submissionService';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

const FileUpload = ({
  onFileUploaded,
  accept = '.pdf,.doc,.docx',
  maxSize = 5 * 1024 * 1024, // 5MB default
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize) {
      setError(`File size should not exceed ${maxSize / 1024 / 1024}MB`);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const response = await submissionService.uploadFile(file);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Upload failed');
      }

      onFileUploaded(response.data.fileUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Box>
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <Box
        sx={{
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 1,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body1">
              Click or drag file to upload
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Supported formats: {accept.replace(/\./g, '').toUpperCase()}
            </Typography>
          </>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 