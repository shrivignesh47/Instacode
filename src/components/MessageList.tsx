
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCheck, Code, Image, Video, ExternalLink } from 'lucide-react';
import { Message } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { supabase, PostWithUser } from '../lib/supabaseClient';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sharedPosts, setSharedPosts] = useState<{ [key: string]: PostWithUser }>({});
  const lastConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const newConversationId = messages.length > 0 ? messages[0].conversation_id : null;

    const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
      // Use timeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior });
      }, 0);
    };

    if (newConversationId && newConversationId !== lastConversationIdRef.current) {
        // New conversation, scroll to bottom immediately.
        scrollToBottom('auto');
        lastConversationIdRef.current = newConversationId;
    } else {
        // Same conversation, only scroll if user is at the bottom.
        const container = scrollContainerRef.current;
        if (container && (container.scrollHeight - container.scrollTop - container.clientHeight < 200)) {
            scrollToBottom('smooth');
        }
    }
  }, [messages]);

  // Fetch shared posts for messages that have shared_post_id
  useEffect(() => {
    const fetchSharedPosts = async () => {
      const postShareMessages = messages.filter(
        msg => msg.message_type === 'post_share' && msg.shared_post_id && !sharedPosts[msg.shared_post_id]
      );

      if (postShareMessages.length === 0) return;

      const postIds = [...new Set(postShareMessages.map(msg => msg.shared_post_id))];

      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (
              id,
              username,
              avatar_url
            )
          `)
          .in('id', postIds);

        if (!error && posts) {
          const postsMap = posts.reduce((acc, post) => {
            acc[post.id] = post as PostWithUser;
            return acc;
          }, {} as { [key: string]: PostWithUser });

          setSharedPosts(prev => ({ ...prev, ...postsMap }));
        }
      } catch (error) {
        console.error('Error fetching shared posts:', error);
      }
    };

    fetchSharedPosts();
  }, [messages, sharedPosts]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderSharedPost = (post: PostWithUser) => {
    const getPostIcon = () => {
      switch (post.type) {
        case 'code':
          return <Code className="w-4 h-4 text-blue-400" />;
        case 'image':
          return <Image className="w-4 h-4 text-green-400" />;
        case 'video':
          return <Video className="w-4 h-4 text-red-400" />;
        case 'project':
          return <ExternalLink className="w-4 h-4 text-purple-400" />;
        default:
          return null;
      }
    };

    return (
      <Link to={`/post/${post.id}`} className="block cursor-pointer">
        <div className="mt-2 border border-white/10 rounded-lg p-3 bg-black/20 hover:bg-black/30 transition-colors">
          <div className="flex items-center space-x-2 mb-2">
            <img
              src={post.profiles.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
              alt={post.profiles.username}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-gray-300 text-sm font-medium">{post.profiles.username}</span>
            <div className="flex items-center space-x-1">
              {getPostIcon()}
              <span className="text-gray-400 text-xs capitalize">{post.type}</span>
            </div>
          </div>
          
          {post.project_title && (
            <h4 className="text-white text-base font-semibold mb-1">{post.project_title}</h4>
          )}
          
          {post.type === 'project' && post.project_description ? (
            <p className="text-gray-300 text-sm line-clamp-3">{post.project_description}</p>
          ) : (
            <p className="text-gray-300 text-sm line-clamp-3">{post.content}</p>
          )}
          
          {post.media_url && (post.type === 'image' || post.type === 'project') && (
            <img
              src={post.media_url}
              alt="Shared content"
              className="mt-2 rounded-lg max-w-full h-auto max-h-48 object-cover"
            />
          )}
          
          {post.media_url && post.type === 'video' && (
            <video
              src={post.media_url}
              controls
              className="mt-2 rounded-lg max-w-full h-auto max-h-48"
            >
              Your browser does not support the video tag.
            </video>
          )}
          
          {post.type === 'code' && post.code_content && post.code_language && (
            <div className="mt-2 bg-gray-900 rounded-md overflow-hidden max-h-48">
              <SyntaxHighlighter
                language={post.code_language}
                style={oneDark}
                customStyle={{ 
                  margin: 0, 
                  padding: '0.75rem', 
                  background: 'transparent',
                  fontSize: '0.8rem' 
                }}
                showLineNumbers={false}
              >
                {post.code_content.slice(0, 500) + (post.code_content.length > 500 ? '\n...' : '')}
              </SyntaxHighlighter>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{post.likes_count} likes • {post.comments_count} comments</span>
            <span>{formatTime(post.created_at)}</span>
          </div>
        </div>
      </Link>
    );
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    const sharedPost = message.shared_post_id ? sharedPosts[message.shared_post_id] : null;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          {/* Message Content */}
          <div className={`px-4 py-3 rounded-2xl ${
            isOwnMessage
              ? 'bg-purple-600 text-white rounded-br-md'
              : 'bg-gray-700 text-gray-100 rounded-bl-md'
          }`}>
            <p className="text-sm break-words">{message.content}</p>
            
            {/* Render shared post if it exists */}
            {sharedPost && renderSharedPost(sharedPost)}
          </div>
          
          {/* Message Info */}
          <div className={`flex items-center mt-1 space-x-1 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              <div className="text-gray-500">
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 lg:p-6"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#374151 #1f2937'
      }}
    >
      <style>
        {`
          .flex-1::-webkit-scrollbar {
            width: 6px;
          }
          .flex-1::-webkit-scrollbar-track {
            background: #1f2937;
          }
          .flex-1::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 3px;
          }
          .flex-1::-webkit-scrollbar-thumb:hover {
            background: #4b5563;
          }
        `}
      </style>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 text-gray-600 mx-auto mb-4">💬</div>
            <h3 className="text-xl font-semibold text-white mb-2">Start the conversation</h3>
            <p className="text-gray-400">Send a message to get started</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;