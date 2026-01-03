import { MongoClient, GridFSBucket, ObjectId, Db } from 'mongodb';
import { Readable } from 'stream';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Cache MongoClient connection
let cachedClient: MongoClient | null = null;

/**
 * Get MongoDB database for GridFS operations
 * Reuses Mongoose connection if available, otherwise creates a new client
 */
async function getDatabase(): Promise<Db> {
  // Try to reuse Mongoose connection's database
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    // Mongoose is connected, use its database directly
    return mongoose.connection.db as unknown as Db;
  }

  // If Mongoose isn't connected, create a cached client
  if (!cachedClient) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    cachedClient = new MongoClient(MONGODB_URI);
    await cachedClient.connect();
  }

  return cachedClient.db();
}

/**
 * Upload a file to GridFS
 * @param fileBuffer - The file buffer to upload
 * @param filename - The filename
 * @param metadata - Optional metadata to store with the file
 * @returns The file ID (ObjectId as string)
 */
export async function uploadFileToGridFS(
  fileBuffer: Buffer,
  filename: string,
  metadata?: Record<string, any>
): Promise<string> {
  const db = await getDatabase();
  const bucket = new GridFSBucket(db, { bucketName: 'files' });

  // Convert buffer to readable stream
  const readableStream = Readable.from(fileBuffer);

  // Upload file
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: metadata || {},
    contentType: 'application/pdf',
  });

  readableStream.pipe(uploadStream);

  return new Promise((resolve, reject) => {
    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Download a file from GridFS
 * @param fileId - The file ID (ObjectId as string)
 * @returns The file buffer and metadata
 */
export async function downloadFileFromGridFS(
  fileId: string
): Promise<{ buffer: Buffer; filename: string; contentType?: string; metadata?: any }> {
  const db = await getDatabase();
  const bucket = new GridFSBucket(db, { bucketName: 'files' });

  // Get file metadata
  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
  if (files.length === 0) {
    throw new Error('File not found');
  }

  const file = files[0];
  const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  for await (const chunk of downloadStream) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);

  return {
    buffer,
    filename: file.filename,
    contentType: file.contentType || 'application/pdf',
    metadata: file.metadata,
  };
}

/**
 * Delete a file from GridFS
 * @param fileId - The file ID (ObjectId as string)
 */
export async function deleteFileFromGridFS(fileId: string): Promise<void> {
  const db = await getDatabase();
  const bucket = new GridFSBucket(db, { bucketName: 'files' });

  await bucket.delete(new ObjectId(fileId));
}

/**
 * Get file metadata from GridFS
 * @param fileId - The file ID (ObjectId as string)
 * @returns File metadata
 */
export async function getFileMetadata(fileId: string): Promise<{
  filename: string;
  length: number;
  contentType?: string;
  uploadDate: Date;
  metadata?: any;
}> {
  const db = await getDatabase();
  const bucket = new GridFSBucket(db, { bucketName: 'files' });

  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
  if (files.length === 0) {
    throw new Error('File not found');
  }

  const file = files[0];
  return {
    filename: file.filename,
    length: file.length,
    contentType: file.contentType,
    uploadDate: file.uploadDate,
    metadata: file.metadata,
  };
}

/**
 * Validate file type (PDF only)
 */
export function validateFileType(filename: string, mimetype?: string): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  const validExtensions = ['pdf'];
  const validMimeTypes = ['application/pdf'];

  if (mimetype && validMimeTypes.includes(mimetype)) {
    return true;
  }

  return extension ? validExtensions.includes(extension) : false;
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return size <= maxSizeBytes;
}

