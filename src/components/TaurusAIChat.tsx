import React, { useState, useRef, useEffect } from 'react';
import { X, Phone, PhoneOff, Video, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface TaurusAIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationSession {
  conversation_id: string;
  conversation_url: string;
  status: 'active' | 'ended' | 'connecting';
}

interface UserAccessState {
  lastUsed: string | null;
  timeRemaining: number; // in seconds
}

const MAX_SESSION_TIME = 180; // 3 minutes in seconds
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const TaurusAIChat: React.FC<TaurusAIChatProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [conversationSession, setConversationSession] = useState<ConversationSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<UserAccessState>({
    lastUsed: null,
    timeRemaining: MAX_SESSION_TIME
  });
  
  const autoEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load user's access state from Supabase or localStorage
  useEffect(() => {
    if (!user) return;
    
    const loadAccessState = async () => {
      try {
        // Try to get from Supabase first
        const { data, error } = await supabase
          .from('user_ai_access')
          .select('last_used, time_remaining')
          .eq('user_id', user.id)
          .single();
        
        if (error || !data) {
          // If not in database, check localStorage
          const savedState = localStorage.getItem(`taurus_access_${user.id}`);
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            setAccessState(parsedState);
          }
          return;
        }
        
        // Calculate if cooldown period has passed
        const lastUsed = data.last_used ? new Date(data.last_used) : null;
        const now = new Date();
        
        if (lastUsed && (now.getTime() - lastUsed.getTime() >= COOLDOWN_PERIOD)) {
          // Reset if 24 hours have passed
          setAccessState({
            lastUsed: null,
            timeRemaining: MAX_SESSION_TIME
          });
        } else {
          // Use stored state
          setAccessState({
            lastUsed: data.last_used,
            timeRemaining: data.time_remaining || MAX_SESSION_TIME
          });
        }
      } catch (err) {
        console.error('Error loading access state:', err);
        // Fallback to default state
        setAccessState({
          lastUsed: null,
          timeRemaining: MAX_SESSION_TIME
        });
      }
    };
    
    loadAccessState();
  }, [user]);

  // Save access state
  const saveAccessState = async (state: UserAccessState) => {
    if (!user) return;
    
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('user_ai_access')
        .upsert({
          user_id: user.id,
          last_used: state.lastUsed,
          time_remaining: state.timeRemaining
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error saving access state to Supabase:', error);
      }
      
      // Also save to localStorage as backup
      localStorage.setItem(`taurus_access_${user.id}`, JSON.stringify(state));
    } catch (err) {
      console.error('Error saving access state:', err);
    }
  };

  // Clean up resources
  const cleanup = () => {
    if (autoEndTimerRef.current) {
      clearTimeout(autoEndTimerRef.current);
      autoEndTimerRef.current = null;
    }
    
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    
    setConversationSession(null);
    setConnectionStatus('disconnected');
    setError(null);
  };

  // Start conversation with Tavus
  const startConversation = async () => {
    if (!user) {
      setError('You must be logged in to use Taurus AI');
      return;
    }
    
    // Check if user has time remaining
    if (accessState.timeRemaining <= 0) {
      const lastUsedDate = accessState.lastUsed ? new Date(accessState.lastUsed) : null;
      const now = new Date();
      
      if (lastUsedDate && (now.getTime() - lastUsedDate.getTime() < COOLDOWN_PERIOD)) {
        // Calculate time until reset
        const timeUntilReset = COOLDOWN_PERIOD - (now.getTime() - lastUsedDate.getTime());
        const hoursUntilReset = Math.floor(timeUntilReset / (60 * 60 * 1000));
        const minutesUntilReset = Math.floor((timeUntilReset % (60 * 60 * 1000)) / (60 * 1000));
        
        setError(`You've used your daily limit. Please wait ${hoursUntilReset}h ${minutesUntilReset}m before trying again.`);
        return;
      } else {
        // Reset time if cooldown period has passed
        setAccessState({
          lastUsed: null,
          timeRemaining: MAX_SESSION_TIME
        });
      }
    }
    
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
            max_call_duration: accessState.timeRemaining, // Use remaining time
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

      // Update access state with current time
      const now = new Date();
      const newAccessState = {
        lastUsed: now.toISOString(),
        timeRemaining: accessState.timeRemaining
      };
      setAccessState(newAccessState);
      saveAccessState(newAccessState);

      // Start countdown timer
      sessionTimerRef.current = setInterval(() => {
        setAccessState(prevState => {
          const newTimeRemaining = Math.max(0, prevState.timeRemaining - 1);
          
          // Save updated time every 10 seconds
          if (newTimeRemaining % 10 === 0) {
            saveAccessState({
              ...prevState,
              timeRemaining: newTimeRemaining
            });
          }
          
          // End session if time runs out
          if (newTimeRemaining === 0) {
            endConversation();
          }
          
          return {
            ...prevState,
            timeRemaining: newTimeRemaining
          };
        });
      }, 1000);

      // Set auto-end timer for remaining time
      autoEndTimerRef.current = setTimeout(() => {
        console.log('Auto-ending conversation after time limit');
        endConversation();
      }, accessState.timeRemaining * 1000);

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

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

        {/* Time Remaining Display */}
        <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-300">Time remaining:</span>
          </div>
          <div className="text-sm font-mono bg-gray-800 px-3 py-1 rounded-md text-white">
            {formatTime(accessState.timeRemaining)}
          </div>
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
                {accessState.timeRemaining > 0 ? (
                  <span> You have <span className="text-purple-400 font-semibold">{formatTime(accessState.timeRemaining)}</span> remaining today.</span>
                ) : (
                  <span> Your daily limit has been reached.</span>
                )}
              </p>
              
              {error && (
                <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6 max-w-md flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
              
              <button
                onClick={startConversation}
                disabled={isConnecting || accessState.timeRemaining <= 0}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : accessState.timeRemaining <= 0 ? (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Daily Limit Reached</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>Start Chat ({formatTime(accessState.timeRemaining)})</span>
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
                Ask me any coding questions - I'm here to help! (Time remaining: {formatTime(accessState.timeRemaining)})
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaurusAIChat;