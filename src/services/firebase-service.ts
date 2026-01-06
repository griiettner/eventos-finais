import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper to get auth token (set by AuthProvider)
let getAccessToken: (() => Promise<string>) | null = null;

export function setFirebaseAuthTokenGetter(getter: () => Promise<string>) {
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

export interface Chapter {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  audio_url?: string;
  order_index: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ChapterPage {
  id: string;
  chapter_id: string;
  subtitle?: string;
  page_number: number;
  content: string;
  order_index: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Question {
  id: string;
  chapter_id: string;
  text: string;
  order_index: number;
  created_at: Timestamp;
}

export interface UserAnswer {
  chapter_id: string;
  question_id: string;
  answer: string;
  updated_at: Timestamp;
}

export interface Progress {
  chapter_id: string;
  is_read: boolean;
  audio_progress: number;
  is_completed: boolean;
  completed_at?: Timestamp;
}

export class FirebaseService {
  // Chapters
  static async getAllChapters(): Promise<Chapter[]> {
    const q = query(collection(db, 'chapters'), orderBy('order_index'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter));
  }

  static async getChapter(id: string): Promise<Chapter | null> {
    const docRef = doc(db, 'chapters', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Chapter : null;
  }

  static async createChapter(chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'chapters'), {
      ...chapter,
      created_at: now,
      updated_at: now
    });
    return docRef.id;
  }

  static async updateChapter(id: string, chapter: Partial<Omit<Chapter, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const docRef = doc(db, 'chapters', id);
    await updateDoc(docRef, {
      ...chapter,
      updated_at: Timestamp.now()
    });
  }

  static async deleteChapter(id: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete chapter
    batch.delete(doc(db, 'chapters', id));
    
    // Delete associated pages
    const pagesQuery = query(collection(db, 'chapter_pages'), where('chapter_id', '==', id));
    const pagesSnapshot = await getDocs(pagesQuery);
    pagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete associated questions
    const questionsQuery = query(collection(db, 'questions'), where('chapter_id', '==', id));
    const questionsSnapshot = await getDocs(questionsQuery);
    questionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
  }

  // Chapter Pages
  static async getChapterPages(chapterId: string): Promise<ChapterPage[]> {
    const q = query(
      collection(db, 'chapter_pages'), 
      where('chapter_id', '==', chapterId),
      orderBy('order_index')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChapterPage));
  }

  static async getChapterPage(pageId: string): Promise<ChapterPage | null> {
    const docRef = doc(db, 'chapter_pages', pageId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as ChapterPage : null;
  }

  static async createChapterPage(page: Omit<ChapterPage, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'chapter_pages'), {
      ...page,
      created_at: now,
      updated_at: now
    });
    return docRef.id;
  }

  static async updateChapterPage(pageId: string, page: Partial<Omit<ChapterPage, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const docRef = doc(db, 'chapter_pages', pageId);
    await updateDoc(docRef, {
      ...page,
      updated_at: Timestamp.now()
    });
  }

  static async deleteChapterPage(pageId: string): Promise<void> {
    await deleteDoc(doc(db, 'chapter_pages', pageId));
  }

  // Questions
  static async getChapterQuestions(chapterId: string): Promise<Question[]> {
    const q = query(
      collection(db, 'questions'),
      where('chapter_id', '==', chapterId),
      orderBy('order_index')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  }

  static async createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'questions'), {
      ...question,
      created_at: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateQuestion(questionId: string, question: Partial<Omit<Question, 'id' | 'created_at'>>): Promise<void> {
    const docRef = doc(db, 'questions', questionId);
    await updateDoc(docRef, question);
  }

  static async deleteQuestion(questionId: string): Promise<void> {
    await deleteDoc(doc(db, 'questions', questionId));
  }

  static async reorderQuestions(_chapterId: string, questionIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    questionIds.forEach((id, index) => {
      const docRef = doc(db, 'questions', id);
      batch.update(docRef, { order_index: index });
    });
    await batch.commit();
  }

  // User Answers
  static async getUserAnswer(chapterId: string, questionId: string, userId: string): Promise<UserAnswer | null> {
    const docRef = doc(db, 'user_answers', `${userId}_${chapterId}_${questionId}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserAnswer : null;
  }

  static async saveUserAnswer(chapterId: string, questionId: string, userId: string, answer: string): Promise<void> {
    const docRef = doc(db, 'user_answers', `${userId}_${chapterId}_${questionId}`);
    await updateDoc(docRef, {
      chapter_id: chapterId,
      question_id: questionId,
      answer,
      updated_at: Timestamp.now()
    }).catch(() => {
      // If document doesn't exist, create it
      return addDoc(collection(db, 'user_answers'), {
        chapter_id: chapterId,
        question_id: questionId,
        answer,
        updated_at: Timestamp.now()
      });
    });
  }

  static async getChapterAnswers(chapterId: string, userId: string): Promise<UserAnswer[]> {
    const q = query(
      collection(db, 'user_answers'),
      where('chapter_id', '==', chapterId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .filter(doc => doc.id.startsWith(userId))
      .map(doc => doc.data() as UserAnswer);
  }

  // Progress
  static async getProgress(chapterId: string, userId: string): Promise<Progress | null> {
    const docRef = doc(db, 'progress', `${userId}_${chapterId}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as Progress : null;
  }

  static async updateProgress(chapterId: string, _userId: string, progress: Partial<Progress>): Promise<void> {
    await apiCall('/api/progress', {
      method: 'POST',
      body: JSON.stringify({
        chapterId,
        completed: progress.is_completed || false,
        currentPage: 0 // Backend expects currentPage, can extend later
      })
    });
  }

  static async markChapterAsRead(chapterId: string, userId: string): Promise<void> {
    await this.updateProgress(chapterId, userId, { is_read: true });
  }

  static async markChapterAsCompleted(chapterId: string, userId: string): Promise<void> {
    await this.updateProgress(chapterId, userId, {
      is_completed: true,
      completed_at: Timestamp.now()
    });
  }

  // Audio Upload (converts to data URL for self-hosting)
  static async uploadAudioFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
