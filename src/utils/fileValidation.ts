const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.scr', '.js', '.php', '.html', '.htm', '.asp', '.aspx', '.jsp'];

export const validateFileUpload = async (file: File): Promise<File> => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Please upload PDF, DOC, DOCX, JPG, or PNG files only.');
  }

  // Check for dangerous file extensions
  const fileName = file.name.toLowerCase();
  const hasDangerousExtension = DANGEROUS_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (hasDangerousExtension) {
    throw new Error('File type not allowed for security reasons.');
  }

  // Check for path traversal attempts
  if (fileName.includes('../') || fileName.includes('..\\') || fileName.includes('%2e%2e')) {
    throw new Error('Invalid file name detected.');
  }

  // Sanitize filename for additional security
  if (!/^[a-zA-Z0-9._\-\s]+$/.test(fileName)) {
    throw new Error('File name contains invalid characters.');
  }

  // Validate file content matches MIME type (basic check)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // PDF signature check
  if (file.type === 'application/pdf') {
    const pdfSignature = bytes.slice(0, 4);
    const isPDF = pdfSignature[0] === 0x25 && pdfSignature[1] === 0x50 && 
                  pdfSignature[2] === 0x44 && pdfSignature[3] === 0x46;
    if (!isPDF) {
      throw new Error('File content does not match PDF format.');
    }
  }

  // JPEG signature check
  if (file.type === 'image/jpeg') {
    const jpegSignature = bytes.slice(0, 2);
    const isJPEG = jpegSignature[0] === 0xFF && jpegSignature[1] === 0xD8;
    if (!isJPEG) {
      throw new Error('File content does not match JPEG format.');
    }
  }

  // PNG signature check
  if (file.type === 'image/png') {
    const pngSignature = bytes.slice(0, 8);
    const isPNG = pngSignature[0] === 0x89 && pngSignature[1] === 0x50 && 
                  pngSignature[2] === 0x4E && pngSignature[3] === 0x47;
    if (!isPNG) {
      throw new Error('File content does not match PNG format.');
    }
  }

  return file;
};

export const generateSecureFileName = (originalName: string): string => {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  
  // Validate extension against allowed types
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  if (!allowedExtensions.includes(extension)) {
    throw new Error('File extension not allowed.');
  }
  
  const uuid = crypto.randomUUID();
  return `${uuid}.${extension}`;
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove potentially dangerous characters and normalize
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100); // Limit length
};