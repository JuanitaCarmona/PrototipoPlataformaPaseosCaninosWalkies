import { uploadPetPhoto } from './uploadPetPhoto';

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  return uploadPetPhoto(userId, localUri);
}
