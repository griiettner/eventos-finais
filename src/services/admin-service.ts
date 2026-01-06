import type { Timestamp } from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Re-export Firebase types with compatible interface
export interface Chapter {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  audio_url?: string;
  order_index: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface Question {
  id: string;
  chapter_id: string;
  text: string;
  order_index: number;
  created_at?: Timestamp;
}

export interface ChapterPage {
  id: string;
  chapter_id: string;
  subtitle?: string;
  page_number: number;
  content: string;
  order_index: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

// Helper to get auth token
let getAccessToken: (() => Promise<string>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken ? await getAccessToken() : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export class AdminService {
  // Chapter Management
  static async getAllChapters(): Promise<Chapter[]> {
    return apiCall<Chapter[]>('/api/chapters');
  }

  static async getChapter(id: string): Promise<Chapter | null> {
    return apiCall<Chapter>(`/api/chapters/${id}`);
  }

  static async createChapter(chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    console.log('[AdminService] Creating chapter:', chapter);
    try {
      const result = await apiCall<Chapter>('/api/chapters', {
        method: 'POST',
        body: JSON.stringify(chapter)
      });
      console.log('[AdminService] Chapter created:', result);
      if (!result || !result.id) {
        console.error('[AdminService] Invalid response - no ID:', result);
        throw new Error('No chapter ID returned from API');
      }
      return result.id;
    } catch (error) {
      console.error('[AdminService] createChapter failed:', error);
      throw error;
    }
  }

  static async updateChapter(id: string, chapter: Partial<Omit<Chapter, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    await apiCall(`/api/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chapter)
    });
  }

  static async deleteChapter(id: string): Promise<void> {
    await apiCall(`/api/chapters/${id}`, { method: 'DELETE' });
  }

  // Question Management
  static async getChapterQuestions(chapterId: string): Promise<Question[]> {
    return apiCall<Question[]>(`/api/chapters/${chapterId}/questions`);
  }

  static async createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<string> {
    const result = await apiCall<Question>(`/api/chapters/${question.chapter_id}/questions`, {
      method: 'POST',
      body: JSON.stringify(question)
    });
    return result.id;
  }

  static async updateQuestion(id: string, question: Partial<Omit<Question, 'id' | 'created_at'>>): Promise<void> {
    // Note: API doesn't have update question endpoint yet, would need to add it
    throw new Error('Update question not implemented in API yet');
  }

  static async deleteQuestion(id: string): Promise<void> {
    await apiCall(`/api/questions/${id}`, { method: 'DELETE' });
  }

  static async reorderQuestions(chapterId: string, questionIds: string[]): Promise<void> {
    // Note: API doesn't have reorder endpoint yet, would need to add it
    throw new Error('Reorder questions not implemented in API yet');
  }

  // Audio file handling (store as base64 data URL)
  static async uploadAudioFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Chapter Pages Management
  static async getChapterPages(chapterId: string): Promise<ChapterPage[]> {
    const pages = await apiCall<any[]>(`/api/chapters/${chapterId}/pages`);
    // Map camelCase from API to snake_case for frontend
    return pages.map(page => ({
      id: page.id,
      chapter_id: page.chapterId,
      subtitle: page.subtitle,
      page_number: page.pageNumber,
      content: page.content,
      order_index: page.orderIndex,
      created_at: page.createdAt,
      updated_at: page.updatedAt
    }));
  }

  static async getChapterPage(pageId: string): Promise<ChapterPage | null> {
    // Note: API doesn't have single page endpoint, would need to add it
    throw new Error('Get single page not implemented in API yet');
  }

  static async createChapterPage(page: Omit<ChapterPage, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await apiCall<ChapterPage>(`/api/chapters/${page.chapter_id}/pages`, {
      method: 'POST',
      body: JSON.stringify(page)
    });
    return result.id;
  }

  static async updateChapterPage(pageId: string, page: Partial<Omit<ChapterPage, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    // Note: API doesn't have update page endpoint yet, would need to add it
    throw new Error('Update page not implemented in API yet');
  }

  static async deleteChapterPage(id: string): Promise<void> {
    await apiCall(`/api/pages/${id}`, { method: 'DELETE' });
  }

  // Note: Page read progress is now handled through /api/progress endpoint
  static async markPageAsRead(chapterId: string, pageId: string, userId: string): Promise<void> {
    // Would use /api/progress endpoint
    throw new Error('Mark page as read not implemented in API yet');
  }

  static async getPageReadProgress(chapterId: string, userId: string): Promise<{ page_id: string; is_read: boolean }[]> {
    // Would use /api/progress endpoint
    return [];
  }
}
