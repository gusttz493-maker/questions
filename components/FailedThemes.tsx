import React from 'react';

interface FailedThemesProps {
  themes: Record<string, number>;
  onRetry: (topic: string) => void;
  onClear: () => void;
  onStartReview: () => void;
}

const FailedThemes: React.FC<FailedThemesProps> = ({ themes, onRetry, onClear, onStartReview }) => {
  // Fix: Explicitly type the destructured parameters to ensure `count`, `a`, and `b` are treated as numbers.
  // This resolves TypeScript errors related to `Object.entries` sometimes returning values of type `unknown`.
  const sortedThemes = Object.entries(themes)
    .filter(([, count]: [string, number]) => count > 0)
    .sort(([, a]: [string, number], [, b]: [string, number]) => b - a);

  if (sortedThemes.length === 0) {
    return null; // Don't render anything if there are no themes to review
  }

  return (
    <div className="bg-amber-50 p-6 rounded-xl shadow-md border border-amber-200 mb-8 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-amber-800">Temas para Revisar</h2>
        <button
          onClick={onClear}
          className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
          title="Limpar histórico de revisão"
          aria-label="Limpar histórico de revisão"
        >
          Limpar Histórico
        </button>
      </div>
      <p className="text-slate-600 mb-5">
        Aqui estão os tópicos que você mais errou. Pratique individualmente ou inicie um quiz de revisão geral.
      </p>

      <div className="mb-6">
        <button
          onClick={onStartReview}
          className="w-full bg-amber-500 text-white px-6 py-3 font-semibold rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V4a1 1 0 011-1zm10 8a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Iniciar Quiz de Revisão Geral
        </button>
      </div>

      <h3 className="text-lg font-semibold text-slate-700 mb-3 border-t border-amber-200 pt-5">Prática por Tópico</h3>
      <ul className="space-y-3">
        {sortedThemes.map(([topic, count]) => (
          <li key={topic} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">{topic}</p>
              <p className="text-sm text-red-600">{count} {count === 1 ? 'erro' : 'erros'}</p>
            </div>
            <button
              onClick={() => onRetry(topic)}
              className="bg-blue-100 text-blue-700 px-4 py-2 font-semibold rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Praticar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FailedThemes;