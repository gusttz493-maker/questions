import React, { useMemo } from 'react';
import type { QuizResult } from '../types';

interface PerformanceChartProps {
  history: QuizResult[];
}

const CATEGORIES: Record<string, string[]> = {
  'Português': ['português', 'gramática', 'literatura', 'redação', 'interpretação'],
  'Matemática': ['matemática', 'álgebra', 'geometria', 'cálculo', 'raciocínio lógico'],
  'História': ['história', 'historia'],
  'Geografia': ['geografia'],
  'Biologia': ['biologia', 'ciências', 'ciencias', 'corpo humano'],
  'Química': ['química', 'quimica'],
  'Física': ['física', 'fisica'],
  'Artes': ['artes', 'música', 'pintura'],
  'Sociologia': ['sociologia'],
  'Filosofia': ['filosofia'],
  'Inglês': ['inglês', 'ingles'],
};

const categorizeTopic = (topic: string): string => {
    const lowerTopic = topic.toLowerCase();
    for (const category in CATEGORIES) {
        if (CATEGORIES[category].some(keyword => lowerTopic.includes(keyword))) {
            return category;
        }
    }
    if (lowerTopic.includes('revisão geral')) {
        return 'Revisão Geral';
    }
    return 'Outros';
};


const PerformanceChart: React.FC<PerformanceChartProps> = ({ history }) => {
  const performanceData = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};

    history.forEach(result => {
      const category = categorizeTopic(result.topic);
      if (!stats[category]) {
        stats[category] = { correct: 0, total: 0 };
      }
      stats[category].correct += result.correct;
      stats[category].total += result.total;
    });

    return Object.entries(stats)
      .map(([subject, data]) => ({
        subject,
        percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        ...data
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [history]);

  if (performanceData.length === 0) {
    return (
        <div className="text-center py-10 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <h3 className="text-lg font-medium text-slate-700">Nenhum dado de desempenho ainda.</h3>
            <p className="text-slate-500 mt-1">Complete alguns quizzes para ver seu progresso aqui!</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
    {performanceData.map(({ subject, percentage, correct, total }) => (
      <div key={subject} className="flex flex-col items-center w-full group">
        <div className="relative w-full h-48 bg-slate-100 rounded-t-lg flex items-end border-x border-t border-slate-200">
           <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -mt-6 text-sm font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {percentage.toFixed(0)}%
          </div>
          <div
            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-1000 ease-out"
            style={{ height: `${percentage}%` }}
            title={`${percentage.toFixed(0)}% (${correct}/${total} acertos)`}
          >
          </div>
        </div>
        <div className="w-full text-center bg-slate-700 text-white p-2 rounded-b-lg text-sm font-medium truncate" title={subject}>
          {subject}
        </div>
      </div>
    ))}
  </div>
  );
};

export default PerformanceChart;