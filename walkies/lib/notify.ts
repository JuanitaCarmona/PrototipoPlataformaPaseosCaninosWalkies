import { supabase } from './supabase';

export async function notifyUser(params: {
  userId: string | null | undefined;
  title: string;
  body: string;
  walkId?: string | null;
}): Promise<void> {
  if (!params.userId) return;
  await supabase.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    body: params.body,
    walk_id: params.walkId ?? null,
  });
}
