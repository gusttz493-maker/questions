import React, { useState, useRef, useEffect } from 'react';
import type { QuizResult } from '../types';
import PerformanceChart from './PerformanceChart';
import { getChatAnswer } from '../services/geminiService';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface PerformanceAndChatProps {
  history: QuizResult[];
  onClearHistory: () => void;
  failedThemes: Record<string, number>;
}

const PerformanceAndChat: React.FC<PerformanceAndChatProps> = ({ history, onClearHistory, failedThemes }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleExportData = () => {
    const dataToExport = {
      quizHistory: history,
      failedThemes: failedThemes,
      chatHistory: chatHistory,
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progresso-estudos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = chatInput.trim();
    if (!trimmedInput || isChatLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: trimmedInput };
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);
    setChatError(null);

    try {
      const modelResponse = await getChatAnswer(trimmedInput);
      const newModelMessage: ChatMessage = { role: 'model', content: modelResponse };
      setChatHistory(prev => [...prev, newModelMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setChatError(errorMessage);
      setChatHistory(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsChatLoading(false);
    }
  };
  
  const renderMessageContent = (content: string) => {
    // Basic markdown for bold (**text**) and lists (* item)
    return content
      .split('\n')
      .map((line, index) => {
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (line.trim().startsWith('* ')) {
          return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
        }
        return <p key={index}>{line}</p>;
      });
  };

  const hasDataToExport = history.length > 0 || Object.keys(failedThemes).length > 0 || chatHistory.length > 0;
  const hasHistoryToClear = history.length > 0;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Painel de Desempenho</h2>
            <p className="text-slate-600 mt-1">Acompanhe seu progresso e gerencie seus dados de estudo.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportData}
              disabled={!hasDataToExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Baixar seus dados de progresso como um arquivo JSON"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Dados
            </button>
            <button
              onClick={onClearHistory}
              disabled={!hasHistoryToClear}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Limpar permanentemente o histórico de quizzes"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar Histórico
            </button>
          </div>
        </div>
        <PerformanceChart history={history} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tire suas Dúvidas com a IA</h2>
        <p className="text-slate-600 mb-6">Tem alguma pergunta sobre um tópico de estudo? Pergunte aqui!</p>
        
        <div 
          ref={chatContainerRef}
          className="h-96 bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4 overflow-y-auto mb-4"
        >
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md lg:max-w-lg p-3 rounded-lg text-slate-800 ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-slate-800 rounded-br-none' 
                    : 'bg-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                <div className="prose prose-sm max-w-none">{renderMessageContent(msg.content)}</div>
              </div>
            </div>
          ))}
          {isChatLoading && (
             <div className="flex justify-start">
              <div className="max-w-md lg:max-w-lg p-3 rounded-lg bg-slate-200 rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {chatError && (
          <p className="text-red-600 text-sm text-center mb-2">{chatError}</p>
        )}

        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Digite sua dúvida aqui..."
            className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
            disabled={isChatLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-3 font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isChatLoading || !chatInput.trim()}
            aria-label="Enviar mensagem"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default PerformanceAndChat;