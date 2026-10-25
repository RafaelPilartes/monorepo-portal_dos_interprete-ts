import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const quickReplies = [
  'Como solicitar um intérprete?',
  'Quais são os preços?',
  'Preciso de ajuda',
  'Falar com um humano'
];

const botResponses: Record<string, string> = {
  'Como solicitar um intérprete?': 'Para solicitar um intérprete, pode: 1) Criar uma conta no portal, 2) Preencher o formulário de solicitação, 3) Aguardar a confirmação. Se preferir, pode ir directamente à página de Contacto.',
  'Quais são os preços?': 'Os preços variam conforme o tipo de serviço, duração e modalidade. Para um orçamento personalizado, por favor preencha o formulário de solicitação ou contacte-nos directamente.',
  'Preciso de ajuda': 'Estou aqui para ajudar! Pode me dizer mais sobre o que precisa? Posso ajudar com informações sobre serviços, como solicitar intérpretes, ou navegar no portal.',
  'Falar com um humano': 'Para falar com nossa equipa, pode contactar-nos através do email info@gracemind.ao ou pelo telefone +244 923 456 789. Respondemos em até 24 horas úteis.',
  'default': 'Obrigado pela sua mensagem! Para questões específicas, recomendamos contactar directamente a nossa equipa através da página de Contacto.'
};

export function FloatingButtons() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! 👋 Sou o assistente virtual do Portal dos Intérpretes. Como posso ajudar?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const response = botResponses[text] || botResponses['default'];
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Buttons Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Tutorials Button */}
        <Link to="/tutorials">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 bg-secondary hover:bg-secondary/90"
            aria-label="Ver Tutorias"
          >
            <GraduationCap className="h-6 w-6" />
          </Button>
        </Link>

        {/* Chat Button */}
        <Button
          size="lg"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110",
            isChatOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
          aria-label={isChatOpen ? "Fechar chat" : "Abrir chat"}
        >
          {isChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mini Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden transition-all duration-300 transform",
          isChatOpen 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Portal dos Intérpretes</h3>
              <p className="text-xs text-white/80">Assistente Virtual</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-muted/30">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] p-3 rounded-2xl text-sm animate-fade-in",
                message.isUser
                  ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card text-foreground shadow-sm rounded-bl-sm"
              )}
            >
              {message.text}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>A escrever...</span>
            </div>
          )}
        </div>

        {/* Quick Replies */}
        <div className="px-4 py-2 border-t border-border bg-card/50">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleSendMessage(reply)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escreva uma mensagem..."
              className="flex-1 px-4 py-2 rounded-full bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-10 w-10"
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
