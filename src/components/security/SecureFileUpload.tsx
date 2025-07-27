
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sanitizeFilename } from '@/lib/validation';
import { FileValidationService } from '@/utils/fileValidation';
import { AlertCircle, Shield, Upload, Loader2 } from 'lucide-react';

interface SecureFileUploadProps {
  id: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  onFileChange: (files: File[] | File | null) => void;
  maxFiles?: number;
  checkDimensions?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  strictMode?: boolean;
}

const SecureFileUpload = ({ 
  id, 
  label, 
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.pptx", 
  multiple = false,
  onFileChange,
  maxFiles = 5,
  checkDimensions = false,
  maxWidth,
  maxHeight,
  strictMode = false
}: SecureFileUploadProps) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const errors: string[] = [];
    const warnings: string[] = [];
    const validFiles: File[] = [];

    setIsValidating(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // Check file count
      if (multiple && files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        setValidationErrors(errors);
        return;
      }

      // Validate each file with enhanced security
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const validation = await FileValidationService.validateFile(file, {
            checkDimensions,
            maxWidth,
            maxHeight,
            strictMode
          });

          if (!validation.isValid) {
            validation.errors.forEach(error => {
              errors.push(`File ${i + 1}: ${error}`);
            });
          } else {
            // Add warnings
            validation.warnings.forEach(warning => {
              warnings.push(`File ${i + 1}: ${warning}`);
            });

            // Sanitize filename for security
            const sanitizedName = sanitizeFilename(file.name);
            const sanitizedFile = new File([file], sanitizedName, { type: file.type });
            validFiles.push(sanitizedFile);
          }
        } catch (error) {
          errors.push(`File ${i + 1}: ${error instanceof Error ? error.message : 'Validation failed'}`);
        }
      }

      setValidationErrors(errors);
      setValidationWarnings(warnings);

      if (errors.length === 0) {
        // Update uploaded files list for display
        setUploadedFiles(validFiles.map(f => f.name));
        
        // Pass valid files to parent
        if (multiple) {
          onFileChange(validFiles);
        } else {
          onFileChange(validFiles[0] || null);
        }
      } else {
        // Clear file input on validation error
        e.target.value = '';
        onFileChange(multiple ? [] : null);
        setUploadedFiles([]);
      }
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setValidationErrors(errors);
      e.target.value = '';
      onFileChange(multiple ? [] : null);
      setUploadedFiles([]);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <Upload className="w-4 h-4" />
        {label}
      </Label>
      
      <div className="space-y-2">
        <Input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        <div className="text-xs text-gray-600 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Enhanced secure upload • Max 50MB • PDF, DOC, DOCX, XLSX, PPTX, JPEG, PNG
          {multiple && ` • Max ${maxFiles} files`}
          {isValidating && (
            <span className="flex items-center gap-1 text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              Validating...
            </span>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Upload Error:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationWarnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Upload Warning:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validationWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <div className="text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
          <strong>Files ready for upload:</strong>
          <ul className="mt-1 list-disc list-inside">
            {uploadedFiles.map((filename, index) => (
              <li key={index}>{filename}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SecureFileUpload;
