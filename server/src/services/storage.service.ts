import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const S3_ENDPOINT = process.env.SUPABASE_S3_ENDPOINT || 'https://oohhyosdgwroiqqttear.storage.supabase.co/storage/v1/s3';
const S3_REGION = process.env.SUPABASE_S3_REGION || 'us-east-1';
const S3_ACCESS_KEY_ID = process.env.SUPABASE_S3_ACCESS_KEY_ID || '';
const S3_SECRET_ACCESS_KEY = process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '';
const S3_BUCKET = process.env.SUPABASE_S3_BUCKET || 'multitenant';

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for Supabase S3 API
});

export class StorageService {
  /**
   * Upload file buffer directly to Supabase S3 with Tenant Partitioning
   */
  static async uploadFile(params: {
    tenantId: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    folder?: string;
  }): Promise<{ key: string; fileUrl: string; bucket: string; fileSize: number }> {
    const { tenantId, fileBuffer, fileName, mimeType, folder = 'uploads' } = params;

    // Sanitize filename and create unique storage key
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = crypto.randomBytes(6).toString('hex');
    const key = `tenant_${tenantId}/${folder}/${Date.now()}_${uniqueId}_${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    try {
      await s3Client.send(command);

      // Derive standard public URL or endpoint path
      // Supabase public storage format: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<key>
      const endpointHost = S3_ENDPOINT.replace(/\/storage\/v1\/s3\/?$/, '');
      const fileUrl = `${endpointHost}/storage/v1/object/public/${S3_BUCKET}/${key}`;

      logger.info(`File uploaded successfully to Supabase S3: ${key}`);

      return {
        key,
        fileUrl,
        bucket: S3_BUCKET,
        fileSize: fileBuffer.length,
      };
    } catch (err: any) {
      logger.error('Failed to upload file to Supabase S3:', err);
      throw new Error(`S3 Upload failed: ${err.message || err}`);
    }
  }

  /**
   * Generate a Presigned Download URL for private files
   */
  static async getPresignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (err: any) {
      logger.error(`Failed to generate presigned URL for key: ${key}`, err);
      throw new Error(`Presigned URL error: ${err.message || err}`);
    }
  }

  /**
   * Delete a file from Supabase S3
   */
  static async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`File deleted successfully from Supabase S3: ${key}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to delete file from Supabase S3 with key: ${key}`, err);
      throw new Error(`S3 Delete failed: ${err.message || err}`);
    }
  }
}
