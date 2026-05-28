import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Uploads a file to local or persistent volume storage.
 * - Development: Saves to ./uploads (local)
 * - Production on Railway: Saves to the path defined in UPLOADS_DIR env var (use a Railway Volume)
 */
export async function uploadFile(
  file: File,
  buffer: Buffer,
  originalFileName: string
): Promise<{ filePath?: string; fileUrl?: string }> {
  // Use environment variable for production persistent volume path.
  // On Railway: attach a Volume and mount it (example: /data/uploads)
  const uploadsDir = process.env.UPLOADS_DIR 
    ? process.env.UPLOADS_DIR 
    : path.join(process.cwd(), 'uploads');

  const uniqueFileName = `${Date.now()}-${originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadsDir, uniqueFileName);

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(filePath, buffer);

  return {
    filePath,
  };
}
