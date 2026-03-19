import { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';

export async function uploadImageFromBuffer(
  buffer: Buffer,
  mimetype: string,
  folder = 'sushil-school',
  resourceType: 'image' | 'auto' | 'raw' = 'image'
): Promise<UploadApiResponse> {
  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType,
  });
}

