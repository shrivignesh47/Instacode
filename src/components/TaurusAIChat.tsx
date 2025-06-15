import React, { useState, useRef, useEffect } from 'react';
import { X, Phone, PhoneOff, Video } from 'lucide-react';

interface TaurusAIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationSession {
  conversation_id: string;
  conversation_url: string;
  status: 'active' | 'ended' | 'connecting';
}

const TaurusAIChat: React.FC<TaurusAIChatProps> = ({ isOpen, onClose }) => {
  const [conversationSession, setConversationSession] = useState<ConversationSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const autoEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Clean up resources
  const cleanup = () => {
    if (autoEndTimerRef.current) {
      clearTimeout(autoEndTimerRef.current);
      autoEndTimerRef.current = null;
    }
    
    setConversationSession(null);
    setConnectionStatus('disconnected');
    setError(null);
  };

  // Start conversation with Tavus
  const startConversation = async () => {
    if (isConnecting || conversationSession) return;

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);

    try {
      console.log('Starting Tavus conversation...');

      const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      // Create conversation session with correct replica ID
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TAVUS_API_KEY,
        },
        body: JSON.stringify({
          replica_id: 'r9fa0878977a',
          conversation_name: `Taurus AI Chat - ${Date.now()}`,
          conversational_context: 'You are Taurus, an expert AI coding assistant. Help users with programming questions, code reviews, debugging, and technical advice. Keep responses conversational and engaging since this is a live video chat. Always respond to user questions and provide helpful coding assistance.',
          properties: {
            max_call_duration: 120, // 2 minutes
            participant_left_timeout: 30,
            participant_absent_timeout: 60,
            enable_recording: false,
            enable_closed_captions: true,
            apply_greenscreen: false,
            language: 'english'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`Failed to create conversation: ${errorData.message || response.statusText}`);
      }

      const conversationData = await response.json();
      console.log('Conversation created:', conversationData);

      const session: ConversationSession = {
        conversation_id: conversationData.conversation_id,
        conversation_url: conversationData.conversation_url,
        status: 'active'
      };

      setConversationSession(session);
      setConnectionStatus('connected');

      // Set auto-end timer for 2 minutes
      autoEndTimerRef.current = setTimeout(() => {
        console.log('Auto-ending conversation after 2 minutes');
        endConversation();
      }, 120000); // 2 minutes

      // Check conversation status periodically
      const statusInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationData.conversation_id}`, {
            headers: {
              'x-api-key': TAVUS_API_KEY,
            }
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('Conversation status:', statusData);
            
            if (statusData.status === 'ended') {
              clearInterval(statusInterval);
              cleanup();
            }
          }
        } catch (error) {
          console.error('Error checking conversation status:', error);
        }
      }, 10000); // Check every 10 seconds

    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
      setConnectionStatus('failed');
    } finally {
      setIsConnecting(false);
    }
  };

  // End conversation
  const endConversation = async () => {
    if (!conversationSession) return;

    try {
      const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
      
      // End the conversation on Tavus
      await fetch(`https://tavusapi.com/v2/conversations/${conversationSession.conversation_id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TAVUS_API_KEY,
        }
      });

      console.log('Conversation ended');
    } catch (error) {
      console.error('Error ending conversation:', error);
    } finally {
      cleanup();
    }
  };

  // Cleanup on component unmount or modal close
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Close modal and cleanup
  const handleClose = () => {
    if (conversationSession) {
      endConversation();
    } else {
      cleanup();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Taurus AI</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 
                  connectionStatus === 'failed' ? 'bg-red-400' : 'bg-gray-400'
                }`}></div>
                <p className="text-sm text-gray-300 capitalize">{connectionStatus}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-gray-900 relative overflow-hidden">
          {!conversationSession ? (
            /* Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                <Video className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Start a Live Conversation with Taurus AI
              </h2>
              <p className="text-gray-300 mb-8 max-w-md">
                Experience real-time AI conversation with video and voice. 
                Ask coding questions, get help with debugging, or discuss architecture decisions.
                Session will automatically end after 2 minutes.
              </p>
              
              {error && (
                <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6 max-w-md">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
              
              <button
                onClick={startConversation}
                disabled={isConnecting}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>Start 2-Minute Chat</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Active Conversation */
            <div className="h-full">
              <iframe
                ref={iframeRef}
                src={conversationSession.conversation_url}
                className="w-full h-full border-0"
                allow="camera; microphone; display-capture; autoplay"
                title="Taurus AI Conversation"
              />
              
              {connectionStatus !== 'connected' && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white">
                      {connectionStatus === 'connecting' ? 'Connecting to Taurus...' : 'Connection failed'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        {conversationSession && (
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={endConversation}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                title="End conversation"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-xs text-gray-400">
                Ask me any coding questions - I'm here to help! (Auto-ends in 2 minutes)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaurusAIChat;