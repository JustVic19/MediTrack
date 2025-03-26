import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, MessageSquare, Send, Plus, PlusCircle, User, UserRound } from 'lucide-react';

// Interfaces
interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: 'patient' | 'doctor' | 'staff';
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isRead: boolean;
  createdAt: Date;
}

interface Conversation {
  id: number;
  patientId: number;
  subject: string;
  departmentId?: number;
  departmentName?: string;
  assignedToId?: number;
  assignedToName?: string;
  status: 'active' | 'resolved' | 'pending';
  priority: 'normal' | 'urgent' | 'low';
  lastMessageAt: Date;
  createdAt: Date;
  unreadCount: number;
  lastMessage?: string;
}

interface Department {
  id: number;
  name: string;
}

function MessageBubble({ message, isCurrentUser }: { message: Message; isCurrentUser: boolean }) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback>
            {message.senderRole === 'patient' ? 'P' : message.senderRole === 'doctor' ? 'D' : 'S'}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">
              {message.senderName}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>
          
          <div className={`rounded-lg px-4 py-2 ${
            isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            
            {message.attachmentUrl && (
              <div className="mt-2">
                <a 
                  href={message.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs underline flex items-center gap-1"
                >
                  <PlusCircle className="h-3 w-3" />
                  Attachment
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationPreview({ conversation, isSelected, onClick }: { 
  conversation: Conversation; 
  isSelected: boolean;
  onClick: () => void;
}) {
  // Format timestamp relative to current time
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(messageDate, 'h:mm a');
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return format(messageDate, 'EEEE');
    } else {
      return format(messageDate, 'MMM d');
    }
  };
  
  const priorityColors = {
    'normal': '',
    'urgent': 'text-red-600',
    'low': 'text-muted-foreground',
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  return (
    <div 
      className={`p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer
        ${isSelected ? 'bg-muted' : ''}
        ${conversation.unreadCount > 0 ? 'bg-primary/5' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className={`font-medium ${conversation.unreadCount > 0 ? 'font-semibold' : ''}`}>
          {conversation.subject}
        </h4>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(conversation.lastMessageAt)}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <p className={`text-sm text-muted-foreground line-clamp-1 ${priorityColors[conversation.priority]}`}>
          {truncateText(conversation.lastMessage || '', 30)}
        </p>
        
        {conversation.unreadCount > 0 && (
          <Badge variant="default" className="text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {conversation.unreadCount}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        {conversation.departmentName && (
          <span>{conversation.departmentName}</span>
        )}
        {conversation.status === 'resolved' && (
          <Badge variant="outline" className="text-xs py-0 h-5">Resolved</Badge>
        )}
      </div>
    </div>
  );
}

export default function PatientPortalMessages({ patientId }: { patientId: number }) {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newConversationDialog, setNewConversationDialog] = useState(false);
  const [newConversationSubject, setNewConversationSubject] = useState('');
  const [newConversationDepartment, setNewConversationDepartment] = useState('');
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Queries
  const { data: conversations = [], isLoading: isLoadingConversations, isError: isConversationsError } = useQuery<Conversation[]>({
    queryKey: ['/api/patient-portal/conversations', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/conversations?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const { data: messages = [], isLoading: isLoadingMessages, isError: isMessagesError } = useQuery<Message[]>({
    queryKey: ['/api/patient-portal/messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      const response = await apiRequest(
        'GET', 
        `/api/patient-portal/messages?conversationId=${selectedConversation.id}`
      );
      return await response.json();
    },
    enabled: !!selectedConversation,
  });
  
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/patient-portal/departments'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/patient-portal/departments');
      return await response.json();
    },
  });
  
  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      conversationId: number; 
      senderId: number; 
      content: string;
    }) => {
      const response = await apiRequest('POST', '/api/patient-portal/messages', data);
      return await response.json();
    },
    onSuccess: () => {
      setNewMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/messages', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/conversations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const createConversationMutation = useMutation({
    mutationFn: async (data: { 
      patientId: number; 
      subject: string; 
      departmentId: number; 
      initialMessage: string;
    }) => {
      const response = await apiRequest('POST', '/api/patient-portal/conversations', data);
      return await response.json();
    },
    onSuccess: (data: Conversation) => {
      toast({
        title: 'Conversation Created',
        description: 'Your new conversation has been started.',
        variant: 'default',
      });
      setNewConversationDialog(false);
      setNewConversationSubject('');
      setNewConversationDepartment('');
      setNewConversationMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/conversations'] });
      setSelectedConversation(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create conversation: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest(
        'POST', 
        `/api/patient-portal/conversations/${conversationId}/read`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/conversations'] });
    }
  });
  
  // Effects
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      markAsReadMutation.mutate(selectedConversation.id);
    }
  }, [selectedConversation, messages]);
  
  // Event handlers
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessageContent.trim()) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      senderId: patientId,
      content: newMessageContent
    });
  };
  
  const handleCreateConversation = () => {
    if (!newConversationSubject.trim() || !newConversationDepartment || !newConversationMessage.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all fields to start a new conversation.',
        variant: 'destructive',
      });
      return;
    }
    
    createConversationMutation.mutate({
      patientId,
      subject: newConversationSubject,
      departmentId: parseInt(newConversationDepartment),
      initialMessage: newConversationMessage
    });
  };
  
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };
  
  const isLoading = isLoadingConversations || (selectedConversation && isLoadingMessages);
  const isError = isConversationsError || isMessagesError;
  
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading messages
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading your messages. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const activeConversations = conversations?.filter(c => c.status !== 'resolved') || [];
  const resolvedConversations = conversations?.filter(c => c.status === 'resolved') || [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Secure Messaging</h2>
        <Button 
          onClick={() => setNewConversationDialog(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>
      
      <Dialog open={newConversationDialog} onOpenChange={setNewConversationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Send a message to your healthcare team. We'll respond as soon as possible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                value={newConversationSubject} 
                onChange={(e) => setNewConversationSubject(e.target.value)}
                placeholder="Brief description of your question"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select 
                value={newConversationDepartment} 
                onValueChange={setNewConversationDepartment}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                value={newConversationMessage} 
                onChange={(e) => setNewConversationMessage(e.target.value)}
                rows={4}
                placeholder="Describe your question or concern in detail"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewConversationDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateConversation}
              disabled={
                !newConversationSubject.trim() || 
                !newConversationDepartment || 
                !newConversationMessage.trim() ||
                createConversationMutation.isPending
              }
            >
              {createConversationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                'Start Conversation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="grid md:grid-cols-12 gap-6 bg-card rounded-lg border">
        {/* Conversation list */}
        <div className="md:col-span-4 border-r">
          <div className="h-full flex flex-col">
            <Tabs defaultValue="active" className="w-full">
              <div className="p-2 border-b">
                <TabsList className="w-full">
                  <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                  <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="active" className="flex-1 h-full">
                <ScrollArea className="h-[500px]">
                  {isLoadingConversations ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : activeConversations.length > 0 ? (
                    activeConversations.map(conversation => (
                      <ConversationPreview 
                        key={conversation.id} 
                        conversation={conversation}
                        isSelected={selectedConversation?.id === conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 h-full text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                      <h3 className="font-medium">No active conversations</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start a new conversation with your healthcare team
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setNewConversationDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New Conversation
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="resolved" className="flex-1 h-full">
                <ScrollArea className="h-[500px]">
                  {isLoadingConversations ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : resolvedConversations.length > 0 ? (
                    resolvedConversations.map(conversation => (
                      <ConversationPreview 
                        key={conversation.id} 
                        conversation={conversation}
                        isSelected={selectedConversation?.id === conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 h-full text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                      <h3 className="font-medium">No resolved conversations</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Past resolved conversations will appear here
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Message view */}
        <div className="md:col-span-8 flex flex-col min-h-[600px]">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b">
                <h3 className="font-medium">{selectedConversation.subject}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  {selectedConversation.departmentName && (
                    <span>{selectedConversation.departmentName}</span>
                  )}
                  <span>•</span>
                  <span>
                    {selectedConversation.status === 'resolved' ? 'Resolved' : 'Active'}
                  </span>
                  <span>•</span>
                  <span>
                    Started {format(new Date(selectedConversation.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map(message => (
                      <MessageBubble 
                        key={message.id} 
                        message={message}
                        isCurrentUser={message.senderRole === 'patient'} 
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 h-full text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="font-medium">No messages yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                )}
              </ScrollArea>
              
              {selectedConversation.status !== 'resolved' && (
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea 
                        value={newMessageContent} 
                        onChange={(e) => setNewMessageContent(e.target.value)}
                        placeholder="Type your message here..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-10 w-10"
                      disabled={!newMessageContent.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <UserRound className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Select a Conversation</h3>
              <p className="text-muted-foreground max-w-md">
                Choose an existing conversation from the list or start a new one to securely message your healthcare team.
              </p>
              <Button 
                onClick={() => setNewConversationDialog(true)} 
                className="mt-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}