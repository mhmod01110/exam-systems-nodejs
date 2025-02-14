import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

const FileUpload = ({ onFileSelect, acceptedTypes, maxSize }) => {
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.size > maxSize) {
      alert(`File size should be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  return (
    <Paper
      sx={{
        p: 3,
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'grey.300',
        backgroundColor: dragActive ? 'action.hover' : 'background.paper',
        cursor: 'pointer'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={acceptedTypes}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      
      <Box sx={{ textAlign: 'center' }}>
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main' }} />
        <Typography variant="h6" gutterBottom>
          Drag and drop or click to upload
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Accepted files: {acceptedTypes}
        </Typography>
        {selectedFile && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Selected: {selectedFile.name}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default FileUpload;