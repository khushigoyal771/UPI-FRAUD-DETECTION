import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hi! I'm your AI Support Assistant for the UPI Fraud Detection Dashboard. I can help you with:\n\n• Understanding features and workflows\n• Technical questions about ML models\n• Data format requirements\n• Troubleshooting issues\n\n💡 **Pro tip**: Highlight any text on the page and click 'Explain' for instant context-aware help!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle text selection across the page
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 3) {
        setSelectedText(text);
        showTooltip(selection);
      } else {
        hideTooltip();
      }
    };

    const showTooltip = (selection: Selection | null) => {
      hideTooltip(); // Remove existing tooltip
      
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const tooltip = document.createElement('div');
      tooltip.id = 'text-selection-tooltip';
      tooltip.className = 'fixed z-[100] bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg text-sm font-medium';
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.bottom + 8}px`;
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.innerHTML = `
        <button class="flex items-center gap-1 hover:opacity-80">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Explain
        </button>
      `;
      
      tooltip.addEventListener('click', () => {
        handleExplainText(selectedText);
        hideTooltip();
        window.getSelection()?.removeAllRanges();
      });
      
      document.body.appendChild(tooltip);
      
      // Auto-hide after 3 seconds
      setTimeout(hideTooltip, 3000);
    };

    const hideTooltip = () => {
      const existing = document.getElementById('text-selection-tooltip');
      if (existing) {
        existing.remove();
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
      hideTooltip();
    };
  }, [selectedText]);

  const generateAIResponse = async (message: string, context = ''): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { message, context }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.success && data?.message) {
        return data.message;
      } else {
        throw new Error(data?.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast.error('Failed to connect to AI assistant. Please try again.');
      return 'Sorry, I encountered an error. Please try asking your question again.';
    }
  };

  const handleExplainText = async (text: string) => {
    if (!text.trim()) return;
    
    setIsOpen(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Please explain: "${text}"`,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Generate AI response
    const response = await generateAIResponse(`Please explain: "${text}"`, text);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: response,
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = inputValue;
    setInputValue("");
    setIsLoading(true);
    
    // Generate AI response
    const response = await generateAIResponse(currentQuestion);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: response,
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        variant="hero"
        size="sm"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="sr-only">Open AI Support Assistant</span>
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96 bg-background border rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <h3 className="font-semibold text-sm">AI Support Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                disabled={!inputValue.trim()}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;