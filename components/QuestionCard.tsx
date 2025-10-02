import React from 'react';
import type { Question } from '../types';

interface QuestionCardProps {
  questionData: Question;
  questionIndex: number;
  onSelectAnswer: (questionIndex: number, selectedOption: string) => void;
  selectedAnswer?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData, questionIndex, onSelectAnswer, selectedAnswer }) => {
  const isAnswered = !!selectedAnswer;

  const getButtonClass = (option: string): string => {
    const baseClass = 'w-full text-left p-4 my-2 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-between';

    if (!isAnswered) {
      return `${baseClass} bg-white border-slate-300 hover:bg-slate-100 text-slate-700`;
    }

    const isCorrect = option === questionData.answer;
    const isSelected = option === selectedAnswer;

    if (isSelected && isCorrect) {
      return `${baseClass} bg-green-100 border-green-500 text-green-800 font-semibold scale-105 shadow-md`;
    }
    if (isSelected && !isCorrect) {
      return `${baseClass} bg-red-100 border-red-500 text-red-800 font-medium`;
    }
    if (!isSelected && isCorrect) {
      return `${baseClass} bg-green-100 border-green-500 text-green-800 font-semibold`;
    }
    
    return `${baseClass} bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-60`;
  };
  
  const AnswerIcon: React.FC<{ option: string }> = ({ option }) => {
    if (!isAnswered) return null;

    const isCorrect = option === questionData.answer;
    const isSelected = option === selectedAnswer;

    if (isCorrect) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    }

    if (isSelected && !isCorrect) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 w-full animate-fade-in">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">
        {`${questionIndex + 1}. ${questionData.question}`}
      </h3>
      <div className="flex flex-col">
        {questionData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelectAnswer(questionIndex, option)}
            className={getButtonClass(option)}
            disabled={isAnswered}
          >
            <span className="flex-1 pr-4">{option}</span>
            <AnswerIcon option={option} />
          </button>
        ))}
      </div>
      {isAnswered && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
          <p className="font-bold text-blue-800">Explicação:</p>
          <p className="text-slate-700 mt-1">{questionData.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
