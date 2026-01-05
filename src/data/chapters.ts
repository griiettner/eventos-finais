export interface Question {
  id: number;
  text: string;
}

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content: string;
  audioUrl: string;
  questions: Question[];
}

// Chapters are now managed via the Admin Dashboard
// All chapter data is stored in the SQLite database
export const chapters: Chapter[] = [];
