import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { notifyUser } from '../lib/notify';

type Message = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

type Props = {
  visible: boolean;
  walkId: string | null;
  otherUserId?: string | null;
  otherName?: string;
  onClose: () => void;
};

export function WalkChatModal({ visible, walkId, otherUserId, otherName, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!walkId) return;
    const { data } = await supabase
      .from('walk_messages')
      .select('id, body, sender_id, created_at')
      .eq('walk_id', walkId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);
  }, [walkId]);

  useEffect(() => {
    if (!visible || !walkId) return;
    setLoading(true);
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [visible, walkId, load]);

  const send = async () => {
    const body = text.trim();
    if (!body || !walkId || !session?.user?.id) return;
    setSending(true);
    const { error } = await supabase.from('walk_messages').insert({
      walk_id: walkId,
      sender_id: session.user.id,
      body,
    });
    setSending(false);
    if (error) return;
    setText('');
    await notifyUser({
      userId: otherUserId,
      title: 'Nuevo mensaje',
      body: body.slice(0, 80),
      walkId,
    });
    void load();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Chat{otherName ? ` · ${otherName}` : ''}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={theme.textDark} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const mine = item.sender_id === session?.user?.id;
              return (
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>Aún no hay mensajes. Di hola.</Text>}
          />
        )}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje"
            placeholderTextColor={theme.textMuted}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.send} onPress={send} disabled={sending || !text.trim()}>
            <MaterialIcons name="send" size={20} color={theme.textLight} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textDark,
    flex: 1,
    marginRight: 12,
  },
  list: {
    paddingBottom: 12,
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    color: theme.textMuted,
    marginTop: 32,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: theme.primary,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: theme.cardMint,
  },
  bubbleText: {
    color: theme.textDark,
    fontSize: 15,
  },
  bubbleTextMine: {
    color: theme.textLight,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.textDark,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
