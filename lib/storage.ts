import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  storagePath: string;
  contentType: string;
  fileSize?: number;
}

export interface UploadInput {
  file?: File;
  uri?: string;
  name?: string;
  mimeType?: string;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function resolveExtension(mimeType?: string, fallbackName?: string) {
  if (mimeType && EXT_BY_MIME[mimeType]) return EXT_BY_MIME[mimeType];
  if (fallbackName && fallbackName.includes('.')) {
    return fallbackName.split('.').pop() ?? 'jpg';
  }
  return 'jpg';
}

async function toBlob(input: UploadInput): Promise<{ blob: Blob; contentType: string }> {
  if (input.file) {
    return { blob: input.file, contentType: input.file.type || input.mimeType || 'image/jpeg' };
  }

  if (!input.uri) {
    throw new Error('Missing upload input');
  }

  const response = await fetch(input.uri);
  const blob = await response.blob();
  return { blob, contentType: input.mimeType || blob.type || 'image/jpeg' };
}

export async function uploadUserMeme(uid: string, memeId: string, input: UploadInput): Promise<UploadResult> {
  const { blob, contentType } = await toBlob(input);
  const ext = resolveExtension(contentType, input.name);
  const storagePath = `users/${uid}/memes/${memeId}.${ext}`;
  const storageRef = ref(storage, storagePath);

  const result = await uploadBytes(storageRef, blob, {
    contentType,
  });

  return {
    storagePath,
    contentType: result.metadata.contentType ?? contentType,
    fileSize: result.metadata.size,
  };
}

export async function getMemeDownloadUrl(storagePath: string) {
  return getDownloadURL(ref(storage, storagePath));
}

export async function deleteMemeStorage(storagePath: string) {
  return deleteObject(ref(storage, storagePath));
}
