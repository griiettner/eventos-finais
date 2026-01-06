const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiServiceClass {
  private getToken(): string | null {
    // Get Kinde token from localStorage
    // Kinde stores the token with a specific key pattern
    const keys = Object.keys(localStorage);
    const tokenKey = keys.find(key => key.includes('kinde') && key.includes('token'));
    if (tokenKey) {
      try {
        const tokenData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
        return tokenData.access_token || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ CHAPTERS ============

  async getChapters(): Promise<Chapter[]> {
    return this.request<Chapter[]>('/api/chapters');
  }

  async getChapter(id: string): Promise<Chapter> {
    return this.request<Chapter>(`/api/chapters/${id}`);
  }

  async createChapter(chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chapter> {
    return this.request<Chapter>('/api/chapters', {
      method: 'POST',
      body: JSON.stringify(chapter),
    });
  }

  async updateChapter(id: string, chapter: Partial<Chapter>): Promise<Chapter> {
    return this.request<Chapter>(`/api/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chapter),
    });
  }

  async deleteChapter(id: string): Promise<void> {
    await this.request(`/api/chapters/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ QUESTIONS ============

  async getQuestions(chapterId: string): Promise<Question[]> {
    return this.request<Question[]>(`/api/chapters/${chapterId}/questions`);
  }

  async createQuestion(chapterId: string, question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
    return this.request<Question>(`/api/chapters/${chapterId}/questions`, {
      method: 'POST',
      body: JSON.stringify(question),
    });
  }

  // ============ CHAPTER PAGES ============

  async getChapterPages(chapterId: string): Promise<ChapterPage[]> {
    return this.request<ChapterPage[]>(`/api/chapters/${chapterId}/pages`);
  }

  async createChapterPage(chapterId: string, page: Omit<ChapterPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChapterPage> {
    return this.request<ChapterPage>(`/api/chapters/${chapterId}/pages`, {
      method: 'POST',
      body: JSON.stringify(page),
    });
  }

  // ============ USER PROGRESS ============

  async getUserProgress(): Promise<UserProgress[]> {
    return this.request<UserProgress[]>('/api/progress');
  }

  async updateUserProgress(progress: { chapterId: string; completed?: boolean; currentPage?: number }): Promise<UserProgress> {
    return this.request<UserProgress>('/api/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  // ============ HEALTH ============

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/health');
  }
}

// Types
export interface Chapter {
  id: string;
  title: string;
  summary: string;
  content: string;
  audioUrl: string;
  orderIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  id: string;
  chapterId: string;
  text: string;
  orderIndex: number;
  createdAt?: Date;
}

export interface ChapterPage {
  id: string;
  chapterId: string;
  subtitle: string;
  pageNumber: number;
  content: string;
  orderIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  chapterId: string;
  completed: boolean;
  currentPage: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ApiService = new ApiServiceClass();
