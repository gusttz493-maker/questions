import React, { useState, useCallback, useEffect } from 'react';
import { generateQuestions } from './services/geminiService';
import type { Question, QuizResult } from './types';
import Spinner from './components/Spinner';
import QuestionCard from './components/QuestionCard';
import FailedThemes from './components/FailedThemes';
import PasswordProtection from './components/PasswordProtection';
import PerformanceAndChat from './components/PerformanceAndChat';

type ActiveTab = 'quiz' | 'performance';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('quiz');
  const [topic, setTopic] = useState<string>('Português para Concursos');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Médio');
  const [failedThemes, setFailedThemes] = useState<Record<string, number>>({});
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);

  useEffect(() => {
    try {
      const storedFailedThemes = localStorage.getItem('failedThemes');
      if (storedFailedThemes) {
        setFailedThemes(JSON.parse(storedFailedThemes));
      }
      const storedHistory = localStorage.getItem('quizHistory');
      if (storedHistory) {
        setQuizHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Falha ao carregar dados do localStorage", error);
      setFailedThemes({});
      setQuizHistory([]);
    }
  }, []);

  const updateFailedThemes = useCallback((theme: string) => {
    setFailedThemes(currentThemes => {
        const newFailedThemes = { ...currentThemes };
        newFailedThemes[theme] = (newFailedThemes[theme] || 0) + 1;
        localStorage.setItem('failedThemes', JSON.stringify(newFailedThemes));
        return newFailedThemes;
    });
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerateQuestions = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Por favor, insira um tópico.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setQuestions([]);
    setUserAnswers({});
    setQuizTopic(topic);

    try {
      let filePayload: { mimeType: string; data: string; } | undefined = undefined;

      if (sourceFile) {
        const base64Data = await fileToBase64(sourceFile);
        filePayload = {
          mimeType: sourceFile.type,
          data: base64Data
        };
      }

      const newQuestions = await generateQuestions(topic, numQuestions, difficulty, filePayload);
      setQuestions(newQuestions);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }, [topic, numQuestions, difficulty, sourceFile]);

  const handleStartReview = useCallback(async () => {
    const topicsToReview = Object.keys(failedThemes);
    if (topicsToReview.length === 0) {
      setError("Não há temas para revisar.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);
    setUserAnswers({});
    setQuizTopic('Revisão Geral');

    const reviewPromptTopic = `uma mistura dos seguintes tópicos que o usuário errou anteriormente: ${topicsToReview.join(', ')}`;

    try {
      const newQuestions = await generateQuestions(reviewPromptTopic, numQuestions, difficulty);
      setQuestions(newQuestions);
      setTimeout(() => {
        document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado ao gerar o quiz de revisão.");
      }
    } finally {
      setLoading(false);
    }
  }, [failedThemes, numQuestions, difficulty]);

  const handleSelectAnswer = useCallback((questionIndex: number, selectedOption: string) => {
    const question = questions[questionIndex];
    if (!userAnswers[questionIndex] && question) {
        if (selectedOption !== question.answer) {
            updateFailedThemes(quizTopic === 'Revisão Geral' ? 'Revisão Geral' : quizTopic);
        }
    }

    const newAnswers = { ...userAnswers, [questionIndex]: selectedOption };
    setUserAnswers(newAnswers);

    const isQuizComplete = Object.keys(newAnswers).length === questions.length && questions.length > 0;
    if (isQuizComplete) {
      setTimeout(() => {
        const correctCount = questions.reduce((count, q, i) => {
          return newAnswers[i] === q.answer ? count + 1 : count;
        }, 0);

        const newHistoryEntry: QuizResult = {
          topic: quizTopic,
          correct: correctCount,
          total: questions.length,
          date: new Date().toISOString(),
        };

        setQuizHistory(prevHistory => {
          const updatedHistory = [...prevHistory, newHistoryEntry];
          localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
          return updatedHistory;
        });
      }, 300);
    }
  }, [questions, userAnswers, quizTopic, updateFailedThemes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSourceFile(e.target.files[0]);
    }
  };

  const handleDragEvents = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
      handleDragEvents(e);
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setIsDragging(true);
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      handleDragEvents(e);
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      handleDragEvents(e);
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          setSourceFile(e.dataTransfer.files[0]);
          e.dataTransfer.clearData();
      }
  };

  const handleRetryTopic = (retryTopic: string) => {
    setTopic(retryTopic);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFailedThemes = () => {
    if (window.confirm("Você tem certeza que deseja limpar seu histórico de temas para revisar?")) {
        setFailedThemes({});
        localStorage.removeItem('failedThemes');
    }
  };
  
  const clearQuizHistory = () => {
    if (window.confirm("Você tem certeza que deseja limpar seu histórico de desempenho? Seus dados serão removidos permanentemente.")) {
        setQuizHistory([]);
        localStorage.removeItem('quizHistory');
    }
  };

  if (!isAuthenticated) {
    return <PasswordProtection onSuccess={() => setIsAuthenticated(true)} />;
  }
  
  const tabClass = (tabName: ActiveTab) => 
    `px-4 py-3 text-lg font-semibold border-b-4 transition-all duration-300 rounded-t-md ${
      activeTab === tabName 
      ? 'border-blue-600 text-blue-700' 
      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
    }`;


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-700 tracking-tight">
            Gerador de Questões com IA
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Sua ferramenta completa para estudos e aprimoramento.
          </p>
        </header>

        <div className="mb-8 border-b border-slate-200">
          <nav className="-mb-px flex space-x-2 sm:space-x-6 justify-center sm:justify-start" aria-label="Tabs">
            <button onClick={() => setActiveTab('quiz')} className={tabClass('quiz')}>
              Gerador de Quiz
            </button>
            <button onClick={() => setActiveTab('performance')} className={tabClass('performance')}>
              Desempenho e Dúvidas
            </button>
          </nav>
        </div>

        {activeTab === 'quiz' && (
          <div className="animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8">
              <form onSubmit={handleGenerateQuestions} className="space-y-4">
                <div>
                  <label htmlFor="topic-input" className="block text-lg font-medium text-slate-700 mb-2">
                    Tópico
                  </label>
                  <input
                    id="topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: React Hooks, Renascimento Italiano..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-slate-700 mb-2">
                    Fonte de Conteúdo <span className="text-sm text-slate-500">(Opcional - PDF, PPTX, DOCX)</span>
                  </label>
                  <div className="mt-1">
                    <label
                      htmlFor="source-file-input"
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragEvents}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex justify-center w-full px-6 py-10 border-2 border-slate-300 border-dashed rounded-md cursor-pointer transition-colors ${loading ? 'bg-slate-100 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-slate-100'} ${isDragging ? 'border-blue-500 bg-blue-50' : ''}`}
                    >
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-slate-600">
                          <span className="relative font-medium text-blue-600 hover:text-blue-500">
                            <span>Anexar um arquivo</span>
                            <input id="source-file-input" name="source-file-input" type="file" className="sr-only" onChange={handleFileChange} disabled={loading} accept=".pdf,.pptx,.ppt,.docx,.doc" />
                          </span>
                          <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-slate-500">PDF, PPTX, DOCX</p>
                      </div>
                    </label>
                  </div>
                  {sourceFile && (
                    <div className="mt-3 flex items-center justify-between bg-slate-100 p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-slate-800 font-medium truncate" title={sourceFile.name}>{sourceFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSourceFile(null)}
                        className="p-1 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 flex-shrink-0 ml-2"
                        aria-label="Remover arquivo"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="num-questions-select" className="block text-sm font-medium text-slate-700 mb-1">
                      Número de Questões
                    </label>
                    <select
                      id="num-questions-select"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      disabled={loading}
                    >
                      <option value={3}>3 Questões</option>
                      <option value={5}>5 Questões</option>
                      <option value={10}>10 Questões</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="difficulty-select" className="block text-sm font-medium text-slate-700 mb-1">
                      Nível de Dificuldade
                    </label>
                    <select
                      id="difficulty-select"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      disabled={loading}
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Difícil">Difícil</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-6 py-3 font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    disabled={loading}
                  >
                    {loading ? 'Gerando...' : 'Gerar Questões'}
                  </button>
                </div>
              </form>
            </div>

            <FailedThemes
              themes={failedThemes}
              onRetry={handleRetryTopic}
              onClear={clearFailedThemes}
              onStartReview={handleStartReview}
            />

            {loading && <Spinner />}

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
                <p className="font-bold">Erro</p>
                <p>{error}</p>
              </div>
            )}

            {questions.length > 0 && (
              <section className="space-y-6 mt-8" id="quiz-section">
                <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-blue-200 pb-2">
                  {quizTopic === 'Revisão Geral' ? 'Quiz de Revisão Geral' : `Quiz sobre: ${quizTopic}`} <span className="text-2xl font-medium text-slate-600">({difficulty})</span>
                </h2>
                {questions.map((q, index) => (
                  <QuestionCard
                    key={index}
                    questionData={q}
                    questionIndex={index}
                    onSelectAnswer={handleSelectAnswer}
                    selectedAnswer={userAnswers[index]}
                  />
                ))}
              </section>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <PerformanceAndChat 
            history={quizHistory}
            onClearHistory={clearQuizHistory}
            failedThemes={failedThemes}
          />
        )}

      </main>
      <footer className="text-center py-6 text-sm text-slate-500">
        <p>Criado com React, Tailwind CSS, e Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;