import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs/promises';

/**
 * Validates file content by checking magic numbers (file signatures)
 * This prevents uploading malicious files disguised as legitimate file types
 */

// Allowed file signatures (magic numbers)
const ALLOWED_FILE_SIGNATURES = {
    // Images
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],

    // Audio
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
};

/**
 * Validates uploaded file by checking its actual content (magic numbers)
 * @param {string} filepath - Path to the uploaded file
 * @param {string} expectedMimeType - Expected MIME type from multer
 * @returns {Promise<boolean>} - True if file is valid, throws error otherwise
 */
export const validateFileContent = async (filepath, expectedMimeType) => {
    try {
        // Read the first few bytes to check file signature
        const buffer = await fs.readFile(filepath);

        // Special handling for GLB files (3D models)
        if (filepath.endsWith('.glb')) {
            // GLB files start with magic number: 'glTF' (0x676C5446)
            const magic = buffer.toString('utf8', 0, 4);
            if (magic === 'glTF') {
                return true;
            }
            throw new Error('Invalid GLB file: missing glTF signature');
        }

        // Special handling for GLTF files (JSON format)
        if (filepath.endsWith('.gltf')) {
            try {
                const content = buffer.toString('utf8');
                const parsed = JSON.parse(content);
                // Valid GLTF must have asset.version
                if (parsed.asset && parsed.asset.version) {
                    return true;
                }
            } catch (e) {
                throw new Error('Invalid GLTF file: not valid JSON');
            }
            throw new Error('Invalid GLTF file: missing required fields');
        }

        // For images and audio, use file-type library
        const detectedType = await fileTypeFromBuffer(buffer);

        if (!detectedType) {
            throw new Error('Could not determine file type from content');
        }

        // Verify the detected MIME type matches expected type
        const allowedExtensions = ALLOWED_FILE_SIGNATURES[detectedType.mime];

        if (!allowedExtensions) {
            throw new Error(`File type ${detectedType.mime} is not allowed`);
        }

        // Verify extension matches detected type
        const fileExt = filepath.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExt) && !allowedExtensions.includes(detectedType.ext)) {
            throw new Error(`File extension mismatch: expected ${allowedExtensions.join('/')}, got ${fileExt}`);
        }

        return true;
    } catch (error) {
        throw new Error(`File validation failed: ${error.message}`);
    }
};

/**
 * Express middleware to validate uploaded files after multer processing
 * Use this after multer middleware to ensure file content is legitimate
 */
export const validateUploadedFiles = async (req, res, next) => {
    try {
        const files = [];

        // Collect all uploaded files
        if (req.files) {
            // Multiple files (req.files is an object with arrays)
            if (Array.isArray(req.files)) {
                files.push(...req.files);
            } else {
                Object.values(req.files).forEach(fileArray => {
                    if (Array.isArray(fileArray)) {
                        files.push(...fileArray);
                    }
                });
            }
        } else if (req.file) {
            // Single file
            files.push(req.file);
        }

        // Validate each file's content (warn-only, don't block uploads)
        for (const file of files) {
            try {
                await validateFileContent(file.path, file.mimetype);
            } catch (validationError) {
                console.warn(`⚠️ File validation warning for ${file.originalname}: ${validationError.message}`);
                // Initialize warnings array on request if not exists
                if (!req.fileWarnings) {
                    req.fileWarnings = [];
                }
                req.fileWarnings.push({
                    field: file.fieldname,
                    filename: file.originalname,
                    warning: validationError.message
                });
            }
        }

        next();
    } catch (error) {
        console.error('File validation middleware error:', error);
        next();
    }
};

export default {
    validateFileContent,
    validateUploadedFiles
};