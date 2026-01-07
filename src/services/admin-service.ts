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
  content_modals?: Record<string, { title: string; content: string }>;
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
  content_modals?: Record<string, { title: string; content: string }>;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

interface ApiChapterPage {
  id: string;
  chapterId: string;
  subtitle?: string;
  pageNumber: number;
  content: string;
  orderIndex: number;
  contentModals?: Record<string, { title: string; content: string }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Helper to get auth token
let getAccessToken: (() => Promise<string>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = null;
  if (getAccessToken) {
    try {
      token = await getAccessToken();
    } catch (e) {
      console.error(`[AdminService] apiCall ${endpoint} - error getting token:`, e);
    }
  }
  
  if (!token) {
    // Se não há token, lançamos um erro silencioso que pode ser ignorado pelos componentes
    // que já lidam com o estado de loading da autenticação.
    throw new Error('AUTH_INITIALIZING');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
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

// API returns camelCase, frontend uses snake_case
interface ApiChapter {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  audioUrl?: string;
  orderIndex: number;
  contentModals?: Record<string, { title: string; content: string }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

function mapChapter(c: ApiChapter): Chapter {
  return {
    id: c.id,
    title: c.title,
    summary: c.summary,
    content: c.content,
    audio_url: c.audioUrl,
    order_index: c.orderIndex,
    content_modals: c.contentModals,
    created_at: c.createdAt,
    updated_at: c.updatedAt
  };
}

export class AdminService {
  // Chapter Management
  static async getAllChapters(): Promise<Chapter[]> {
    const chapters = await apiCall<ApiChapter[]>('/api/chapters');
    return chapters.map(mapChapter);
  }

  static async getChapter(id: string): Promise<Chapter | null> {
    const chapter = await apiCall<ApiChapter>(`/api/chapters/${id}`);
    return chapter ? mapChapter(chapter) : null;
  }

  static async createChapter(chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const result = await apiCall<Chapter>('/api/chapters', {
        method: 'POST',
        body: JSON.stringify(chapter)
      });
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

  static async updateQuestion(): Promise<void> {
    // Note: API doesn't have update question endpoint yet, would need to add it
    throw new Error('Update question not implemented in API yet');
  }

  static async deleteQuestion(id: string): Promise<void> {
    await apiCall(`/api/questions/${id}`, { method: 'DELETE' });
  }

  static async reorderQuestions(): Promise<void> {
    // Note: API doesn't have reorder endpoint yet, would need to add it
    throw new Error('Reorder questions not implemented in API yet');
  }

  // Audio file handling (upload to backend -> Firebase Storage)
  static async uploadAudioFile(chapterId: string, file: File): Promise<string> {
    const token = getAccessToken ? await getAccessToken() : null;

    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch(`${API_URL}/api/chapters/${chapterId}/audio`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const data = (await response.json()) as { audioUrl?: string };
    if (!data?.audioUrl) {
      throw new Error('No audioUrl returned from API');
    }
    return data.audioUrl;
  }

  // Chapter Pages Management
  static async getChapterPages(chapterId: string): Promise<ChapterPage[]> {
    const pages = await apiCall<ApiChapterPage[]>(`/api/chapters/${chapterId}/pages`);
    // Map camelCase from API to snake_case for frontend
    return pages.map(page => ({
      id: page.id,
      chapter_id: page.chapterId,
      subtitle: page.subtitle,
      page_number: page.pageNumber,
      content: page.content,
      order_index: page.orderIndex,
      content_modals: page.contentModals,
      created_at: page.createdAt,
      updated_at: page.updatedAt
    }));
  }

  static async getChapterPage(): Promise<ChapterPage | null> {
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

  static async updateChapterPage(): Promise<void> {
    // Note: API doesn't have update page endpoint yet, would need to add it
    throw new Error('Update page not implemented in API yet');
  }

  static async deleteChapterPage(id: string): Promise<void> {
    await apiCall(`/api/pages/${id}`, { method: 'DELETE' });
  }

  // Page read progress handling
  static async setPageReadStatus(chapterId: string, pageId: string, isRead: boolean): Promise<void> {
    await apiCall('/api/progress/page', {
      method: 'POST',
      body: JSON.stringify({ chapterId, pageId, isRead })
    });
  }

  static async markPageAsRead(chapterId: string, pageId: string): Promise<void> {
    return this.setPageReadStatus(chapterId, pageId, true);
  }

  static async markPageAsUnread(chapterId: string, pageId: string): Promise<void> {
    return this.setPageReadStatus(chapterId, pageId, false);
  }

  static async getPageReadProgress(chapterId: string): Promise<{ page_id: string; is_read: boolean }[]> {
    const progress = await apiCall<{ pageId: string; isRead: boolean }[]>(`/api/chapters/${chapterId}/progress/pages`);
    return progress.map(p => ({
      page_id: p.pageId,
      is_read: p.isRead
    }));
  }

  static async getChapterDetailedProgress(chapterId: string): Promise<{
    isCompleted: boolean;
    isAudioFinished: boolean;
    readPagesCount: number;
    totalPagesCount: number;
    answeredQuestionsCount: number;
    totalQuestionsCount: number;
  }> {
    return apiCall(`/api/chapters/${chapterId}/progress/detailed`);
  }

  static async getAllChaptersProgress(): Promise<Record<string, {
    isCompleted: boolean;
    isAudioFinished: boolean;
    readPagesCount: number;
    totalPagesCount: number;
    answeredQuestionsCount: number;
    totalQuestionsCount: number;
  }>> {
    return apiCall('/api/progress/all');
  }

  static async getChapterProgress(chapterId: string): Promise<{ is_completed: boolean; is_audio_finished: boolean }> {
    const progress = await apiCall<{ isCompleted: boolean; isAudioFinished: boolean }>(`/api/chapters/${chapterId}/progress`);
    return {
      is_completed: progress.isCompleted,
      is_audio_finished: progress.isAudioFinished || false
    };
  }

  static async updateAudioProgress(chapterId: string, isAudioFinished: boolean): Promise<void> {
    await apiCall(`/api/chapters/${chapterId}/progress/audio`, {
      method: 'POST',
      body: JSON.stringify({ isAudioFinished })
    });
  }

  static async toggleChapterCompletion(chapterId: string, isCompleted: boolean): Promise<void> {
    await apiCall(`/api/chapters/${chapterId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ isCompleted })
    });
  }

  // User Answers handling
  static async saveUserAnswer(chapterId: string, questionId: string, answer: string): Promise<void> {
    await apiCall('/api/answers', {
      method: 'POST',
      body: JSON.stringify({ chapterId, questionId, answer })
    });
  }

  static async getChapterAnswers(chapterId: string): Promise<{ question_id: string; answer: string }[]> {
    const answers = await apiCall<{ questionId: string; answer: string }[]>(`/api/chapters/${chapterId}/answers`);
    return answers.map(a => ({
      question_id: a.questionId,
      answer: a.answer
    }));
  }

  static async updateUserProfile(username: string, email: string): Promise<void> {
    await apiCall('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, email })
    });
  }

  static async getUserProfile(): Promise<{ username: string; email: string; isAdmin: boolean }> {
    return apiCall('/api/profile');
  }
}
