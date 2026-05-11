import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Message } from '../types';

export default function Chat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) setCurrentUserId(userData.user.id);
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          receiver_id,
          sender:sender_id (id, username, avatar_url),
          receiver:receiver_id (id, username, avatar_url)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const uniqueUsers = new Map();
      data?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === currentUserId ? msg.receiver : msg.sender;
        if (!uniqueUsers.has(otherUserId)) {
          uniqueUsers.set(otherUserId, otherUser);
        }
      });

      setConversations(Array.from(uniqueUsers.values()));
      setLoading(false);
    } catch (err) {
      console.error('Erreur conversations:', err);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Marquer comme lus
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', userId);
    } catch (err) {
      console.error('Erreur messages:', err);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-' + Math.random().toString(36).substr(2, 9))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (selectedUserId) {
            if (
              (payload.new.sender_id === currentUserId && payload.new.receiver_id === selectedUserId) ||
              (payload.new.sender_id === selectedUserId && payload.new.receiver_id === currentUserId)
            ) {
              setMessages((prev) => [...prev, payload.new]);
            }
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        content: newMessage,
      });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Erreur envoi:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar Conversations */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-slate-400 p-4">Chargement...</p>
          ) : conversations.length === 0 ? (
            <p className="text-center text-slate-400 p-4">Aucune conversation</p>
          ) : (
            conversations.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id);
                  fetchMessages(user.id);
                }}
                className={`w-full p-3 border-b border-slate-200 text-left hover:bg-slate-50 flex items-center gap-3 ${
                  selectedUserId === user.id ? 'bg-blue-50' : ''
                }`}
              >
                <img src={user.avatar_url || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-sm text-slate-800">{user.username}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${onlineUsers.has(user.id) ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <p className="text-xs text-slate-500">{onlineUsers.has(user.id) ? 'En ligne' : 'Hors ligne'}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_id === currentUserId
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Envoyer un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Envoyer
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>Sélectionner une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
