import { supabase } from './supabase';

const BUCKET = 'pet-photos';

/**
 * Sube una foto de mascota desde una URI local (galería o cámara)
 * y devuelve la URL pública. Crear el bucket "pet-photos" en Supabase
 * (Dashboard → Storage → New bucket, nombre: pet-photos, Public: sí).
 */
export async function uploadPetPhoto(
  userId: string,
  localUri: string
): Promise<string> {
  // En web la galería devuelve blob: URL; el nombre no debe contener "blob:" ni caracteres raros
  const isBlob = localUri.startsWith('blob:');
  const ext = isBlob ? 'jpg' : (localUri.split('.').pop()?.toLowerCase() || 'jpg');
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  // En web, Supabase acepta mejor File con nombre; en móvil usamos el blob
  const body =
    typeof File !== 'undefined'
      ? new File([blob], fileName.split('/').pop() ?? 'photo.jpg', { type: contentType })
      : blob;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, body, { contentType, upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}
