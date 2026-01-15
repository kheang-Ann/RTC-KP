/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
      fileSize: 1 * 1024 * 1024,
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

export const userProfileUploadConfig = createUploadConfig('profiles'); // example
