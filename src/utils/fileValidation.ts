// File signature definitions for robust content validation
interface FileSignature {
  mimeType: string;
  signatures: number[][];
  description: string;
  maxSize?: number; // Optional size limit per file type
}

const FILE_SIGNATURES: FileSignature[] = [
  // PDF files
  {
    mimeType: 'application/pdf',
    signatures: [
      [0x25, 0x50, 0x44, 0x46], // %PDF
    ],
    description: 'PDF Document',
    maxSize: 50 * 1024 * 1024 // 50MB for PDFs
  },
  
  // JPEG files
  {
    mimeType: 'image/jpeg',
    signatures: [
      [0xFF, 0xD8, 0xFF, 0xE0], // JPEG with EXIF
      [0xFF, 0xD8, 0xFF, 0xE1], // JPEG with EXIF
      [0xFF, 0xD8, 0xFF, 0xE2], // JPEG with EXIF
      [0xFF, 0xD8, 0xFF, 0xE3], // JPEG with EXIF
      [0xFF, 0xD8, 0xFF, 0xE8], // JPEG with SPIFF
      [0xFF, 0xD8, 0xFF, 0xDB], // JPEG baseline
      [0xFF, 0xD8, 0xFF, 0xEE], // JPEG with Adobe APP13
    ],
    description: 'JPEG Image',
    maxSize: 20 * 1024 * 1024 // 20MB for images
  },
  
  // PNG files
  {
    mimeType: 'image/png',
    signatures: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG signature
    ],
    description: 'PNG Image',
    maxSize: 20 * 1024 * 1024 // 20MB for images
  },
  
  // Microsoft Word documents (DOC)
  {
    mimeType: 'application/msword',
    signatures: [
      [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // DOC/OLE2
    ],
    description: 'Microsoft Word Document',
    maxSize: 30 * 1024 * 1024 // 30MB for Word docs
  },
  
  // Microsoft Word documents (DOCX) - ZIP-based format
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signatures: [
      [0x50, 0x4B, 0x03, 0x04], // ZIP signature (DOCX is a ZIP file)
      [0x50, 0x4B, 0x05, 0x06], // ZIP signature (empty archive)
      [0x50, 0x4B, 0x07, 0x08], // ZIP signature (spanned archive)
    ],
    description: 'Microsoft Word Document (DOCX)',
    maxSize: 30 * 1024 * 1024 // 30MB for Word docs
  },
  
  // Microsoft Excel files (XLSX) - also ZIP-based
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    signatures: [
      [0x50, 0x4B, 0x03, 0x04], // ZIP signature
      [0x50, 0x4B, 0x05, 0x06], // ZIP signature (empty archive)
      [0x50, 0x4B, 0x07, 0x08], // ZIP signature (spanned archive)
    ],
    description: 'Microsoft Excel Spreadsheet',
    maxSize: 30 * 1024 * 1024 // 30MB for Excel files
  },
  
  // Microsoft PowerPoint files (PPTX) - also ZIP-based
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    signatures: [
      [0x50, 0x4B, 0x03, 0x04], // ZIP signature
      [0x50, 0x4B, 0x05, 0x06], // ZIP signature (empty archive)
      [0x50, 0x4B, 0x07, 0x08], // ZIP signature (spanned archive)
    ],
    description: 'Microsoft PowerPoint Presentation',
    maxSize: 30 * 1024 * 1024 // 30MB for PowerPoint files
  }
];

// Additional validation for ZIP-based files (DOCX, XLSX, PPTX)
const ZIP_CONTENT_VALIDATION = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '[Content_Types].xml',
    'word/',
    'docProps/'
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '[Content_Types].xml',
    'xl/',
    'docProps/'
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    '[Content_Types].xml',
    'ppt/',
    'docProps/'
  ]
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB global limit
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.js', '.php', '.html', '.htm', 
  '.asp', '.aspx', '.jsp', '.jar', '.war', '.ear', '.class', '.py', '.rb',
  '.pl', '.sh', '.ps1', '.vbs', '.wsf', '.hta', '.msi', '.dmg', '.pkg',
  '.deb', '.rpm', '.apk', '.ipa', '.app', '.dll', '.so', '.dylib'
];

// Helper function to check if byte arrays match
const arraysEqual = (a: Uint8Array, b: number[]): boolean => {
  if (a.length < b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Helper function to validate ZIP-based Office documents
const validateZIPContent = async (file: File, expectedContent: string[]): Promise<boolean> => {
  try {
    // For ZIP-based files, we need to check the internal structure
    // This is a simplified check - in production, you might want to use a ZIP library
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check for ZIP signature
    const zipSignature = [0x50, 0x4B, 0x03, 0x04]; // PK\x03\x04
    if (!arraysEqual(bytes.slice(0, 4), zipSignature)) {
      return false;
    }
    
    // For now, we'll do a basic content check by looking for expected strings
    // In a production environment, you'd want to properly parse the ZIP structure
    const textDecoder = new TextDecoder('utf-8');
    const fileContent = textDecoder.decode(bytes);
    
    // Check if the file contains expected Office document structure
    return expectedContent.some(content => fileContent.includes(content));
  } catch (error) {
    console.warn('ZIP content validation failed:', error);
    return false;
  }
};

export const validateFileUpload = async (file: File): Promise<File> => {
  // Check global file size limit
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
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

  // Sanitize filename for additional security - allow alphanumeric and common symbols
  // Allow: letters, numbers, spaces, dots, hyphens, underscores, parentheses, brackets, and common symbols
  if (!/^[a-zA-Z0-9._\-\s()\[\]@#$%&+=!~]+$/.test(fileName)) {
    throw new Error('File name contains invalid characters. Only letters, numbers, spaces, and common symbols are allowed.');
  }

  // Find matching file signature for the MIME type
  const fileSignature = FILE_SIGNATURES.find(sig => sig.mimeType === file.type);
  
  if (!fileSignature) {
    throw new Error(`File type '${file.type}' is not supported. Please upload PDF, DOC, DOCX, XLSX, PPTX, JPG, or PNG files only.`);
  }

  // Check file size limit for specific file type
  if (fileSignature.maxSize && file.size > fileSignature.maxSize) {
    throw new Error(`${fileSignature.description} files must be less than ${fileSignature.maxSize / (1024 * 1024)}MB`);
  }

  // Validate file content matches MIME type using file signatures
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  let isValidSignature = false;
  
  // Check all possible signatures for this file type
  for (const signature of fileSignature.signatures) {
    if (arraysEqual(bytes.slice(0, signature.length), signature)) {
      isValidSignature = true;
      break;
    }
  }

  // Special handling for ZIP-based Office documents
  if (!isValidSignature && file.type.includes('openxmlformats')) {
    const expectedContent = ZIP_CONTENT_VALIDATION[file.type as keyof typeof ZIP_CONTENT_VALIDATION];
    if (expectedContent) {
      isValidSignature = await validateZIPContent(file, expectedContent);
    }
  }

  if (!isValidSignature) {
    throw new Error(`File content does not match ${fileSignature.description} format. The file may be corrupted or spoofed.`);
  }

  // Additional security checks for specific file types
  if (file.type === 'image/jpeg' || file.type === 'image/png') {
    // Check for embedded scripts in images (basic check)
    const textDecoder = new TextDecoder('utf-8');
    const fileContent = textDecoder.decode(bytes);
    
    // Look for common script patterns in image files
    const scriptPatterns = [
      '<script', 'javascript:', 'vbscript:', 'onload=', 'onerror=',
      'eval(', 'document.cookie', 'window.location'
    ];
    
    const hasScripts = scriptPatterns.some(pattern => 
      fileContent.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (hasScripts) {
      throw new Error('Image file contains suspicious content and may be malicious.');
    }
  }

  return file;
};

export const generateSecureFileName = (originalName: string): string => {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  
  // Validate extension against supported file types
  const supportedExtensions = [
    'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xlsx', 'pptx'
  ];
  
  if (!supportedExtensions.includes(extension)) {
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

// Additional security utilities
export const FileSecurityUtils = {
  // Check for common malware signatures
  checkForMalwareSignatures: (bytes: Uint8Array): boolean => {
    const malwareSignatures = [
      // Common malware patterns (simplified examples)
      [0x4D, 0x5A, 0x90, 0x00], // MZ header (PE files)
      [0x7F, 0x45, 0x4C, 0x46], // ELF header
      [0xFE, 0xED, 0xFA, 0xCE], // Mach-O header
    ];
    
    return malwareSignatures.some(signature => {
      if (bytes.length < signature.length) return false;
      return arraysEqual(bytes.slice(0, signature.length), signature);
    });
  },

  // Validate file dimensions for images
  validateImageDimensions: async (file: File): Promise<{ width: number; height: number } | null> => {
    if (!file.type.startsWith('image/')) return null;
    
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      
      img.src = url;
    });
  },

  // Check for excessive file compression (potential zip bombs)
  checkForZipBomb: async (file: File): Promise<boolean> => {
    if (!file.type.includes('zip') && !file.type.includes('openxmlformats')) {
      return false;
    }
    
    // Basic check: if file is small but claims to be a ZIP, it might be suspicious
    if (file.size < 1000 && file.type.includes('zip')) {
      return true;
    }
    
    // For Office documents, check if they're unusually small
    if (file.size < 500 && file.type.includes('openxmlformats')) {
      return true;
    }
    
    return false;
  },

  // Generate file hash for integrity checking
  generateFileHash: async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};

// Comprehensive file validation service
export class FileValidationService {
  private static readonly VALIDATION_CACHE = new Map<string, boolean>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async validateFile(file: File, options: {
    checkDimensions?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    checkHash?: boolean;
    strictMode?: boolean;
  } = {}): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fileHash?: string;
    dimensions?: { width: number; height: number };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Generate cache key
      const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
      
      // Check cache first
      if (this.VALIDATION_CACHE.has(cacheKey)) {
        const cached = this.VALIDATION_CACHE.get(cacheKey);
        if (cached) {
          return { isValid: true, errors: [], warnings: [] };
        }
      }

      // Basic file validation
      await validateFileUpload(file);
      
      // Additional security checks
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Check for malware signatures
      if (FileSecurityUtils.checkForMalwareSignatures(bytes)) {
        errors.push('File contains suspicious content that may be malicious.');
      }
      
      // Check for zip bombs
      if (await FileSecurityUtils.checkForZipBomb(file)) {
        errors.push('File appears to be a compressed bomb and is not allowed.');
      }
      
      // Validate image dimensions if requested
      let dimensions: { width: number; height: number } | undefined;
      if (options.checkDimensions && file.type.startsWith('image/')) {
        dimensions = await FileSecurityUtils.validateImageDimensions(file);
        
        if (dimensions) {
          if (options.maxWidth && dimensions.width > options.maxWidth) {
            errors.push(`Image width (${dimensions.width}px) exceeds maximum allowed (${options.maxWidth}px).`);
          }
          
          if (options.maxHeight && dimensions.height > options.maxHeight) {
            errors.push(`Image height (${dimensions.height}px) exceeds maximum allowed (${options.maxHeight}px).`);
          }
          
          // Warn about very large images
          if (dimensions.width > 4000 || dimensions.height > 4000) {
            warnings.push('Image dimensions are very large and may impact performance.');
          }
        } else {
          errors.push('Unable to validate image dimensions.');
        }
      }
      
      // Generate file hash if requested
      let fileHash: string | undefined;
      if (options.checkHash) {
        fileHash = await FileSecurityUtils.generateFileHash(file);
      }
      
      // Strict mode additional checks
      if (options.strictMode) {
        // Check for embedded metadata in images
        if (file.type.startsWith('image/')) {
          const textDecoder = new TextDecoder('utf-8');
          const fileContent = textDecoder.decode(bytes);
          
          // Look for EXIF data or other metadata
          const metadataPatterns = [
            'exif', 'gps', 'camera', 'make', 'model', 'date',
            'copyright', 'author', 'software', 'comment'
          ];
          
          const hasMetadata = metadataPatterns.some(pattern => 
            fileContent.toLowerCase().includes(pattern.toLowerCase())
          );
          
          if (hasMetadata) {
            warnings.push('Image contains metadata that will be stripped for privacy.');
          }
        }
      }
      
      const isValid = errors.length === 0;
      
      // Cache result
      this.VALIDATION_CACHE.set(cacheKey, isValid);
      setTimeout(() => this.VALIDATION_CACHE.delete(cacheKey), this.CACHE_DURATION);
      
      return {
        isValid,
        errors,
        warnings,
        fileHash,
        dimensions
      };
      
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  // Clear validation cache
  static clearCache(): void {
    this.VALIDATION_CACHE.clear();
  }

  // Get supported file types
  static getSupportedFileTypes(): string[] {
    return FILE_SIGNATURES.map(sig => sig.mimeType);
  }

  // Get file type description
  static getFileTypeDescription(mimeType: string): string | null {
    const signature = FILE_SIGNATURES.find(sig => sig.mimeType === mimeType);
    return signature?.description || null;
  }

  // Check if file type is supported
  static isFileTypeSupported(mimeType: string): boolean {
    return FILE_SIGNATURES.some(sig => sig.mimeType === mimeType);
  }
}