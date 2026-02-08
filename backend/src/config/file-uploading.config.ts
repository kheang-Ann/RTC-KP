import { diskStorage } from 'multer';
import { extname } from 'path';

export function createUploadConfig(folderName: string) {
  return {
    storage: diskStorage({
      destination: `./uploads/${folderName}`,
      filename: (req, file, callback) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = extname(file.originalname);
        callback(null, `${folderName}-${uniqueName}${extension}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const allowedTypes = /\.(jpg|jpeg|png)$/i;
      if (!allowedTypes.test(file.originalname)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
  };
}

export function createDocumentUploadConfig(folderName: string) {
  return {
    storage: diskStorage({
      destination: `./uploads/${folderName}`,
      filename: (req, file, callback) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = extname(file.originalname);
        callback(null, `${folderName}-${uniqueName}${extension}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB for documents
    },
    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const allowedTypes = /\.(jpg|jpeg|png|pdf|doc|docx)$/i;
      if (!allowedTypes.test(file.originalname)) {
        return callback(
          new Error('Only image and document files are allowed!'),
          false,
        );
      }
      callback(null, true);
    },
  };
}

export const studentUploadConfig = createUploadConfig('students');
export const teacherUploadConfig = createUploadConfig('teachers');
export const leaveDocumentUploadConfig =
  createDocumentUploadConfig('leave-documents');
