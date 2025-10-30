import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Send,
  Plus,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';

interface SupportChat {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  lastMessage?: string;
}

interface SupportMessage {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  isSupport: boolean;
}

const SupportChat = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatData, setNewChatData] = useState({
    subject: '',
    category: 'technical',
    priority: 'normal',
    message: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      setLoading(true);
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data: chatsData, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedChats = chatsData?.map(chat => ({
        id: chat.id,
        ticketNumber: chat.ticket_number,
        subject: chat.subject,
        category: chat.category,
        priority: chat.priority,
        status: chat.status,
        createdAt: chat.created_at,
        lastMessage: 'Cargando...'
      })) || [];

      setChats(formattedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los chats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      // Obtener nombres de usuarios por separado
      const userIds = messagesData?.map(m => m.sender_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (error) throw error;

      // Crear mapa de perfiles
      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as {[key: string]: any}) || {};

      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        message: msg.message,
        senderId: msg.sender_id,
        senderName: profilesMap[msg.sender_id]?.full_name || 'Usuario',
        createdAt: msg.created_at,
        isSupport: false // TODO: determinar si es mensaje de soporte
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    }
  };

  const createNewChat = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Usuario no autenticado');

      // Crear el chat
      const { data: chatData, error: chatError } = await supabase
        .from('support_chats')
        .insert({
          user_id: user.data.user.id,
          subject: newChatData.subject,
          category: newChatData.category,
          priority: newChatData.priority
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Crear el primer mensaje
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          chat_id: chatData.id,
          sender_id: user.data.user.id,
          message: newChatData.message
        });

      if (messageError) throw messageError;

      // Limpiar form y recargar
      setNewChatData({
        subject: '',
        category: 'technical',
        priority: 'normal',
        message: ''
      });
      setShowNewChatForm(false);
      loadChats();
      setSelectedChat(chatData.id);

      toast({
        title: "Chat creado",
        description: `Ticket ${chatData.ticket_number} creado exitosamente`
      });

    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el chat",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('support_messages')
        .insert({
          chat_id: selectedChat,
          sender_id: user.data.user.id,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedChat);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'waiting_customer': return 'bg-yellow-500';
      case 'resolved': return 'bg-purple-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar - Lista de Chats */}
      <div className="w-1/3 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Soporte</h2>
            <Button size="sm" onClick={() => setShowNewChatForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                selectedChat === chat.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">{chat.ticketNumber}</span>
                <div className="flex gap-1">
                  <Badge className={`${getPriorityColor(chat.priority)} text-white text-xs`}>
                    {chat.priority}
                  </Badge>
                  <Badge className={`${getStatusColor(chat.status)} text-white text-xs`}>
                    {chat.status}
                  </Badge>
                </div>
              </div>
              
              <h4 className="font-medium line-clamp-1 mb-1">{chat.subject}</h4>
              <p className="text-xs text-muted-foreground">
                {new Date(chat.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {showNewChatForm ? (
          <Card className="m-4 max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Crear Nuevo Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asunto</label>
                <Input
                  value={newChatData.subject}
                  onChange={(e) => setNewChatData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Describe tu problema brevemente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <Select
                    value={newChatData.category}
                    onValueChange={(value) => setNewChatData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Pagos</SelectItem>
                      <SelectItem value="delivery">Entregas</SelectItem>
                      <SelectItem value="product">Productos</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prioridad</label>
                  <Select
                    value={newChatData.priority}
                    onValueChange={(value) => setNewChatData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  value={newChatData.message}
                  onChange={(e) => setNewChatData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe tu problema en detalle..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewChatForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createNewChat}
                  className="flex-1"
                  disabled={!newChatData.subject || !newChatData.message}
                >
                  Crear Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : selectedChat ? (
          <>
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === (messages[0]?.senderId) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isSupport
                          ? 'bg-blue-500 text-white'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecciona un chat</h3>
              <p className="text-muted-foreground">
                Elige un ticket existente o crea uno nuevo
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChat;