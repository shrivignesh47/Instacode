import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  ArrowLeft,
  Circle,
  Check,
  CheckCheck
} from 'lucide-react';
import Layout from '../components/Layout';

const MessagesPage = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatList, setShowChatList] = useState(true);

  const chats = [
    {
      id: 1,
      name: 'Sarah Chen',
      username: '@sarah_dev',
      avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      lastMessage: 'Thanks for the code review! The changes look great.',
      time: '2m',
      unread: 2,
      online: true,
      type: 'direct',
      verified: true,
    },
    {
      id: 2,
      name: 'React Developers',
      username: '1,234 members',
      avatar: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=50',
      lastMessage: 'Anyone working with Next.js 13 app router?',
      time: '15m',
      unread: 5,
      online: false,
      type: 'group',
      verified: false,
    },
    {
      id: 3,
      name: 'Alex Rivera',
      username: '@alex_builds',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      lastMessage: 'Check out this new library I found!',
      time: '1h',
      unread: 0,
      online: true,
      type: 'direct',
      verified: false,
    },
    {
      id: 4,
      name: 'Python Study Group',
      username: '89 members',
      avatar: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=50',
      lastMessage: 'Meeting tomorrow at 3 PM EST',
      time: '2h',
      unread: 1,
      online: false,
      type: 'group',
      verified: false,
    },
    {
      id: 5,
      name: 'Emma Wilson',
      username: '@emma_codes',
      avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      lastMessage: 'The deployment went smoothly!',
      time: '3h',
      unread: 0,
      online: false,
      type: 'direct',
      verified: true,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'Sarah Chen',
      content: 'Hey! I reviewed your pull request and it looks really good.',
      time: '10:30 AM',
      isOwn: false,
      status: 'read',
    },
    {
      id: 2,
      sender: 'You',
      content: 'Thanks! I spent a lot of time on the error handling.',
      time: '10:32 AM',
      isOwn: true,
      status: 'read',
    },
    {
      id: 3,
      sender: 'Sarah Chen',
      content: 'I noticed that. The try-catch blocks are well structured. Just one small suggestion about the loading states.',
      time: '10:35 AM',
      isOwn: false,
      status: 'read',
    },
    {
      id: 4,
      sender: 'You',
      content: 'Sure, what do you think could be improved?',
      time: '10:36 AM',
      isOwn: true,
      status: 'delivered',
    },
    {
      id: 5,
      sender: 'Sarah Chen',
      content: 'Thanks for the code review! The changes look great.',
      time: '10:38 AM',
      isOwn: false,
      status: 'read',
    },
  ];

  const selectedChatData = chats.find(chat => chat.id === selectedChat);
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const handleChatSelect = (chatId: number) => {
    setSelectedChat(chatId);
    setShowChatList(false); // Hide chat list on mobile when chat is selected
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setShowChatList(true);
  };

  return (
    <Layout>
      <div className="h-full bg-gray-900 flex overflow-hidden">
        {/* Chat List - Responsive */}
        <div className={`${
          showChatList ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-80 xl:w-96 bg-gray-800 border-r border-gray-700 flex-col flex-shrink-0`}>
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl lg:text-2xl font-bold text-white">Messages</h1>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className={`p-4 lg:p-6 cursor-pointer transition-all duration-200 border-b border-gray-700/50 hover:bg-gray-700/50 ${
                  selectedChat === chat.id ? 'bg-gray-700 border-l-4 border-l-purple-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                    />
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                    )}
                    {chat.type === 'group' && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 border-2 border-gray-800 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm lg:text-base font-semibold text-white truncate">
                          {chat.name}
                        </h3>
                        {chat.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{chat.time}</span>
                        {chat.unread > 0 && (
                          <div className="bg-purple-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                            {chat.unread > 99 ? '99+' : chat.unread}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{chat.username}</p>
                    <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area - Responsive */}
        <div className={`${
          !showChatList ? 'flex' : 'hidden'
        } lg:flex flex-1 flex-col bg-gray-900 min-w-0`}>
          {selectedChatData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 lg:p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Back button for mobile */}
                  <button
                    onClick={handleBackToList}
                    className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="relative flex-shrink-0">
                    <img
                      src={selectedChatData.avatar}
                      alt={selectedChatData.name}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                    />
                    {selectedChatData.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg lg:text-xl font-semibold text-white truncate">
                        {selectedChatData.name}
                      </h2>
                      {selectedChatData.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {selectedChatData.type === 'group' 
                        ? selectedChatData.username
                        : selectedChatData.online 
                          ? 'Active now' 
                          : 'Last seen 2h ago'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {selectedChatData.type === 'direct' && (
                    <>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                        <Video className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                      message.isOwn ? 'order-2' : 'order-1'
                    }`}>
                      <div className={`px-4 py-3 rounded-2xl ${
                        message.isOwn
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-700 text-gray-100 rounded-bl-md'
                      }`}>
                        <p className="text-sm lg:text-base break-words">{message.content}</p>
                      </div>
                      <div className={`flex items-center mt-1 space-x-1 ${
                        message.isOwn ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs text-gray-500">{message.time}</span>
                        {message.isOwn && (
                          <div className="text-gray-500">
                            {message.status === 'read' ? (
                              <CheckCheck className="w-3 h-3 text-blue-400" />
                            ) : message.status === 'delivered' ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 lg:p-6 bg-gray-800 border-t border-gray-700 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Your messages</h3>
                <p className="text-gray-400 mb-6">
                  Send a message to start a conversation with other developers.
                </p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                  Start a conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;