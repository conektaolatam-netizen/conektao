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

  // Load all conversations
  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive"
      });
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
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
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new conversation
  const createConversation = async (title: string, isTemporary: boolean = false) => {
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
      toast({
        title: "Error",
        description: "No se pudo crear la conversación",
        variant: "destructive"
      });
      return null;
    }
  };

  // Save message
  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
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
      return data;
    } catch (error: any) {
      console.error('Error saving message:', error);
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
    createConversation,
    selectConversation,
    saveMessage,
    deleteConversation,
    updateConversationTitle,
    setMessages
  };
};
