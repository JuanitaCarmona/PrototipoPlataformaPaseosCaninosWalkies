import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, read_at, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    const rows = (data as NotificationRow[]) ?? [];
    setItems(rows);
    setUnread(rows.filter((n) => !n.read_at).length);
  }, [session?.user?.id]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  const openPanel = async () => {
    setOpen(true);
    setLoading(true);
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, read_at, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    const rows = (data as NotificationRow[]) ?? [];
    setItems(rows);
    const unreadIds = rows.filter((n) => !n.read_at).map((n) => n.id);
    setUnread(unreadIds.length);
    if (unreadIds.length > 0) {
      const nowIso = new Date().toISOString();
      await supabase.from('notifications').update({ read_at: nowIso }).in('id', unreadIds);
      setItems(rows.map((n) => ({ ...n, read_at: n.read_at ?? nowIso })));
      setUnread(0);
    }
    setLoading(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.bell} onPress={openPanel} activeOpacity={0.85}>
        <MaterialIcons name="notifications-none" size={22} color={theme.primaryDark} />
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.panel, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Notificaciones</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <MaterialIcons name="close" size={24} color={theme.textDark} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.empty}>No tienes notificaciones todavía.</Text>
              }
              renderItem={({ item }) => (
                <View style={[styles.item, !item.read_at && styles.itemUnread]}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.body ? <Text style={styles.itemBody}>{item.body}</Text> : null}
                  <Text style={styles.itemDate}>
                    {new Date(item.created_at).toLocaleString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  panel: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textDark,
  },
  empty: {
    textAlign: 'center',
    color: theme.textMuted,
    marginTop: 32,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  itemUnread: {
    backgroundColor: theme.primarySurface,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textDark,
  },
  itemBody: {
    marginTop: 4,
    color: theme.textMuted,
    fontSize: 14,
  },
  itemDate: {
    marginTop: 6,
    fontSize: 12,
    color: theme.textMuted,
  },
});
