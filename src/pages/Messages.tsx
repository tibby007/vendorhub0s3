import React, { useState, useEffect, useRef } from 'react';
import {
  PaperAirplaneIcon,
  FolderIcon,
  UserIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import type { Message, Deal } from '../types';

interface ConversationThread {
  id: string;
  dealId: string;
  dealTitle: string;
  customerName: string;
  lastMessage?: Message;
  unreadCount: number;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

// Mock data for messaging
const MOCK_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv-1',
    dealId: '1',
    dealTitle: 'CAT 320 Excavator - John Smith',
    customerName: 'John Smith',
    unreadCount: 2,
    participants: [
      { id: 'user-1', name: 'John Smith', role: 'customer' },
      { id: 'user-2', name: 'Mike Vendor', role: 'vendor' },
      { id: 'current-user', name: 'Cheryl Tibbs', role: 'broker' }
    ],
    lastMessage: {
      id: 'msg-1',
      deal_id: '1',
      sender_id: 'user-2',
      recipient_id: 'current-user',
      message_content: 'Customer is asking about delivery timeline. Can you provide an update on approval status?',
      is_read: false,
      created_at: '2024-08-12T10:30:00Z',
      sender: {
        id: 'user-2',
        organization_id: 'org-1',
        email: 'mike@vendor.com',
        role: 'vendor',
        first_name: 'Mike',
        last_name: 'Vendor',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  },
  {
    id: 'conv-2',
    dealId: '2',
    dealTitle: 'Ford F-550 Dump Truck - Sarah Johnson',
    customerName: 'Sarah Johnson',
    unreadCount: 0,
    participants: [
      { id: 'user-3', name: 'Sarah Johnson', role: 'customer' },
      { id: 'user-4', name: 'Bob Vendor', role: 'vendor' },
      { id: 'current-user', name: 'Cheryl Tibbs', role: 'broker' }
    ],
    lastMessage: {
      id: 'msg-2',
      deal_id: '2',
      sender_id: 'current-user',
      recipient_id: 'user-4',
      message_content: 'Credit has been pulled. The score came back at 682, which is in the acceptable range. Moving forward with approval process.',
      is_read: true,
      created_at: '2024-08-11T15:45:00Z',
      sender: {
        id: 'current-user',
        organization_id: 'org-1',
        email: 'ctibbs2@outlook.com',
        role: 'broker',
        first_name: 'Cheryl',
        last_name: 'Tibbs',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  },
  {
    id: 'conv-3',
    dealId: '3',
    dealTitle: 'Haas VF-4SS CNC Mill - Michael Brown',
    customerName: 'Michael Brown',
    unreadCount: 1,
    participants: [
      { id: 'user-5', name: 'Michael Brown', role: 'customer' },
      { id: 'user-6', name: 'Tech Vendor', role: 'vendor' },
      { id: 'user-7', name: 'Lisa Officer', role: 'loan_officer' },
      { id: 'current-user', name: 'Cheryl Tibbs', role: 'broker' }
    ],
    lastMessage: {
      id: 'msg-3',
      deal_id: '3',
      sender_id: 'user-7',
      recipient_id: 'current-user',
      message_content: 'Great news! The deal has been approved. Term sheet will be issued tomorrow. Customer can expect delivery within 30 days.',
      is_read: false,
      created_at: '2024-08-12T09:15:00Z',
      sender: {
        id: 'user-7',
        organization_id: 'org-1',
        email: 'lisa@company.com',
        role: 'loan_officer',
        first_name: 'Lisa',
        last_name: 'Officer',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  }
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1-1',
      deal_id: '1',
      sender_id: 'user-2',
      recipient_id: 'current-user',
      message_content: 'Hi Cheryl, the customer is asking about the status of their excavator financing application. Do you have any updates?',
      is_read: true,
      created_at: '2024-08-12T09:00:00Z',
      sender: {
        id: 'user-2',
        organization_id: 'org-1',
        email: 'mike@vendor.com',
        role: 'vendor',
        first_name: 'Mike',
        last_name: 'Vendor',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: 'msg-1-2',
      deal_id: '1',
      sender_id: 'current-user',
      recipient_id: 'user-2',
      message_content: 'Hi Mike! The application is currently under review. We should have an update by end of week. I\'ll keep you posted!',
      is_read: true,
      created_at: '2024-08-12T09:15:00Z',
      sender: {
        id: 'current-user',
        organization_id: 'org-1',
        email: 'ctibbs2@outlook.com',
        role: 'broker',
        first_name: 'Cheryl',
        last_name: 'Tibbs',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: 'msg-1-3',
      deal_id: '1',
      sender_id: 'user-2',
      recipient_id: 'current-user',
      message_content: 'Customer is asking about delivery timeline. Can you provide an update on approval status?',
      is_read: false,
      created_at: '2024-08-12T10:30:00Z',
      sender: {
        id: 'user-2',
        organization_id: 'org-1',
        email: 'mike@vendor.com',
        role: 'vendor',
        first_name: 'Mike',
        last_name: 'Vendor',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  ]
};

export const Messages: React.FC = () => {
  const { userProfile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationThread[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation, messages]);

  const filteredConversations = conversations.filter(conv => 
    conv.dealTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !userProfile) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      deal_id: selectedConv!.dealId,
      sender_id: 'current-user',
      recipient_id: 'user-2', // In real app, this would be determined by context
      message_content: newMessage,
      is_read: true,
      created_at: new Date().toISOString(),
      sender: {
        id: 'current-user',
        organization_id: userProfile.organization_id,
        email: userProfile.email,
        role: userProfile.role,
        first_name: userProfile.first_name || 'User',
        last_name: userProfile.last_name || '',
        is_active: true,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at
      }
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), message]
    }));

    // Update the last message in conversation
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: message }
        : conv
    ));

    setNewMessage('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'broker': return 'bg-green-500';
      case 'vendor': return 'bg-blue-500';
      case 'loan_officer': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full flex bg-white">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <div className="mt-3 relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conv.id ? 'bg-green-50 border-green-200' : ''
              }`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <FolderIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conv.customerName}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-1">
                      {conv.dealTitle}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">
                          {conv.lastMessage.sender?.first_name}: 
                        </span>
                        {conv.lastMessage.message_content}
                      </p>
                    )}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedConv.customerName}</h2>
                  <p className="text-sm text-gray-600">{selectedConv.dealTitle}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {selectedConv.participants.map((participant, index) => (
                      <div
                        key={participant.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getRoleColor(participant.role)} ring-2 ring-white`}
                        title={`${participant.name} (${participant.role})`}
                      >
                        {participant.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationMessages.map((message) => {
                const isOwn = message.sender_id === 'current-user';
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getRoleColor(message.sender?.role || 'user')}`}>
                        {message.sender?.first_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className={`px-4 py-2 rounded-lg ${
                          isOwn 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.message_content}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${
                          isOwn ? 'text-right' : 'text-left'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversation Selected</h3>
              <p className="text-gray-600">Choose a conversation from the sidebar to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};