export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface SourceFile {
  mimeType: string;
  data: string; // base64 encoded string
}

export interface QuizResult {
  topic: string;
  correct: number;
  total: number;
  date: string;
}
