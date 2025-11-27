import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Plus, 
  Clock, 
  Trash2,
  Edit2,
  Check,
  X 
} from 'lucide-react';
import { AIConversation } from '@/hooks/useAIConversations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConversationsListProps {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  onSelectConversation: (conversation: AIConversation) => void;
  onNewConversation: (title: string, isTemporary: boolean) => void;
  onDeleteConversation: (conversationId: string) => void;
  onUpdateTitle: (conversationId: string, newTitle: string) => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onUpdateTitle
}) => {
  const [newChatTitle, setNewChatTitle] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [chatType, setChatType] = useState<'saved' | 'temporary'>('saved');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateChat = () => {
    if (!newChatTitle.trim()) return;
    onNewConversation(newChatTitle, chatType === 'temporary');
    setNewChatTitle('');
    setShowNewChatDialog(false);
  };

  const handleStartEdit = (conv: AIConversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateTitle(editingId, editTitle);
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span>Conversaciones</span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowNewChatDialog(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay conversaciones guardadas</p>
              <p className="text-xs mt-1">Crea una nueva para comenzar</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                  currentConversation?.id === conv.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
                onClick={() => editingId !== conv.id && onSelectConversation(conv)}
              >
                {editingId === conv.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveEdit}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{conv.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(conv.last_message_at)}
                          </span>
                          {conv.is_temporary && (
                            <Badge variant="outline" className="text-xs">
                              Temporal
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(conv);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(conv.id);
                          }}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New Chat Dialog */}
      <AlertDialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nueva Conversación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Cómo deseas guardar esta conversación?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Título de la conversación
              </label>
              <Input
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Ej: Consulta sobre impuestos de enero"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={chatType === 'saved' ? 'default' : 'outline'}
                onClick={() => setChatType('saved')}
                className="flex-1"
              >
                💾 Guardar conversación
              </Button>
              <Button
                variant={chatType === 'temporary' ? 'default' : 'outline'}
                onClick={() => setChatType('temporary')}
                className="flex-1"
              >
                ⏱️ Chat temporal
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {chatType === 'saved'
                ? 'La conversación se guardará permanentemente y podrás volver a ella en cualquier momento.'
                : 'El chat temporal no se guardará en la base de datos y se perderá al cerrar o cambiar de conversación.'}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateChat}>
              Crear conversación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La conversación y todos sus mensajes se eliminarán permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDeleteConversation(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConversationsList;
