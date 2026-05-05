import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Button from '../../components/ui/Button';

// For monolith deploy: relative VITE_API_URL like '/api' means same origin — use undefined so socket.io auto-detects
const SOCKET_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (!apiUrl || apiUrl.startsWith('/')) return undefined; // same-origin: let socket.io auto-detect
  return apiUrl.replace('/api', '');
})();

export default function ChatRoom() {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let newSocket;
    let isMounted = true;

    // 1. Fetch meeting and initial messages
    const initChat = async () => {
      try {
        // Dynamically choose endpoint based on role
        let meetingEndpoint = '/meetings/client';
        if (user.role === 'admin') meetingEndpoint = '/meetings/firm';
        else if (user.role === 'lawyer') meetingEndpoint = '/meetings/lawyer';

        const [meetingRes, messagesRes] = await Promise.all([
          api.get(meetingEndpoint),
          api.get(`/meetings/${meetingId}/messages`)
        ]);
        
        if (!isMounted) return;

        const allMeetings = meetingRes.data.data;
        const currentMeeting = allMeetings.find(m => m._id === meetingId);
        
        if (!currentMeeting || currentMeeting.status !== 'accepted') {
          toast.error('Chat not available');
          navigate('/dashboard');
          return;
        }
        
        setMeeting(currentMeeting);
        setMessages(messagesRes.data.data);
        setLoading(false);

        // 2. Initialize Socket
        newSocket = io(SOCKET_URL, {
          auth: { token },
        });

        newSocket.on('connect', () => {
          if (isMounted) {
            newSocket.emit('join_room', { meetingId });
          }
        });

        newSocket.on('receive_message', (message) => {
          if (isMounted) {
            setMessages(prev => {
              // PREVENT DUPLICATES: Only add if message doesn't exist in state
              if (prev.some(m => m._id === message._id)) return prev;
              return [...prev, message];
            });
          }
        });

        newSocket.on('message_deleted', ({ messageId }) => {
          if (isMounted) {
            setMessages(prev => prev.filter(m => m._id !== messageId));
          }
        });

        newSocket.on('chat_cleared', () => {
          if (isMounted) {
            setMessages([]);
            toast.success('Chat history cleared');
          }
        });

        newSocket.on('error', (err) => {
          if (isMounted) toast.error(err);
        });

        setSocket(newSocket);
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to initialize chat');
          navigate('/dashboard');
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (newSocket) newSocket.disconnect();
    };
  }, [meetingId, token, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('send_message', { meetingId, content: input.trim() });
    setInput('');
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket) return;
    if (window.confirm('Delete this message for everyone?')) {
      socket.emit('delete_message', { meetingId, messageId });
    }
  };

  const handleClearChat = () => {
    if (!socket) return;
    if (window.confirm('Are you sure you want to delete the ENTIRE chat history for both sides? This cannot be undone.')) {
      socket.emit('clear_chat', { meetingId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin text-[#d4af37]" size={32} />
      </div>
    );
  }

  const otherPersonName = user.role === 'client' 
    ? (meeting.lawyerId?.name || meeting.firmId?.name)
    : (user.role === 'admin' 
        ? `${meeting.lawyerId?.name || 'Firm Admin'} ↔ ${meeting.clientId?.name}` 
        : meeting.clientId?.name);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="bg-[#111111] border-b border-[#2a2a2a] p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-[#a0a0a0] hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-bold">
            {otherPersonName?.[0]}
          </div>
          <div>
            <h2 className="text-white font-bold font-['Playfair_Display']">{otherPersonName}</h2>
            <div className="flex items-center gap-1.5 text-emerald-500 text-xs">
              <ShieldCheck size={12} /> Secure E2E Session
            </div>
          </div>
        </div>
        <button 
          onClick={handleClearChat}
          className="text-[#555] hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
        <AnimatePresence>
          {messages.map((msg, i) => {
            const isMe = msg.senderId?._id === user._id || msg.senderId === user._id;
            return (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#555] text-[10px] font-bold uppercase tracking-widest">
                    {isMe ? 'You' : msg.senderId?.name}
                  </span>
                  <span className="text-[#333] text-[10px]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="relative flex items-center gap-2 group max-w-[75%]">
                  {isMe && (
                    <button 
                      onClick={() => handleDeleteMessage(msg._id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg order-first"
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div 
                    className={`flex-1 px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                      isMe 
                        ? 'bg-[#d4af37] text-black rounded-tr-sm' 
                        : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#111111] border-t border-[#2a2a2a] p-4">
        <form onSubmit={sendMessage} className="flex items-center gap-3 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a secure message..."
            className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-5 py-3 text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#d4af37]/50 transition-all pr-14"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#d4af37] text-black rounded-lg flex items-center justify-center hover:bg-[#b08d20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
