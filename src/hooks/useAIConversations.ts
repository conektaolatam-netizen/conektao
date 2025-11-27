import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIConversation {
  id: string;
  title: string;
  is_temporary: boolean;
  last_message_at: string;
  created_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const useAIConversations = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load all conversations with retry
  const loadConversations = async (retries = 3): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadConversations(retries - 1);
      }
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive"
      });
    }
  };

  // Load most recent active conversation
  const loadRecentConversation = async (): Promise<AIConversation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('restaurant_id', profile?.restaurant_id)
        .eq('is_temporary', false)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error loading recent conversation:', error);
      return null;
    }
  };

  // Load messages for a conversation with retry
  const loadMessages = async (conversationId: string, retries = 3): Promise<void> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })));
    } catch (error: any) {
      console.error('Error loading messages:', error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadMessages(conversationId, retries - 1);
      }
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new conversation with retry
  const createConversation = async (title: string, isTemporary: boolean = false, retries = 3): Promise<AIConversation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          restaurant_id: profile?.restaurant_id,
          title,
          is_temporary: isTemporary
        })
        .select()
        .single();

      if (error) throw error;
      
      if (!isTemporary) {
        await loadConversations();
      }
      
      setCurrentConversation(data);
      setMessages([]);
      
      return data;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return createConversation(title, isTemporary, retries - 1);
      }
      toast({
        title: "Error",
        description: "No se pudo crear la conversación",
        variant: "destructive"
      });
      return null;
    }
  };

  // Save message with retry
  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string, retries = 3): Promise<AIMessage | null> => {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, { ...data, role: data.role as 'user' | 'assistant' }]);
      return { ...data, role: data.role as 'user' | 'assistant' };
    } catch (error: any) {
      console.error('Error saving message:', error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return saveMessage(conversationId, role, content, retries - 1);
      }
      toast({
        title: "Error",
        description: "No se pudo guardar el mensaje",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Select conversation
  const selectConversation = async (conversation: AIConversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      await loadConversations();
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      toast({
        title: "Conversación eliminada",
        description: "La conversación se eliminó correctamente"
      });
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación",
        variant: "destructive"
      });
    }
  };

  // Update conversation title
  const updateConversationTitle = async (conversationId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title: newTitle })
        .eq('id', conversationId);

      if (error) throw error;

      await loadConversations();
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, title: newTitle });
      }
    } catch (error: any) {
      console.error('Error updating conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el título",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    loadConversations,
    loadRecentConversation,
    createConversation,
    selectConversation,
    saveMessage,
    deleteConversation,
    updateConversationTitle,
    setMessages
  };
};
