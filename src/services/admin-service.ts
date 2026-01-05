import { DBService } from '../db/db-service';

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content: string;
  audio_url: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Question {
  id: number;
  chapter_id: number;
  text: string;
  order_index: number;
  created_at?: string;
}

export interface ChapterPage {
  id: number;
  chapter_id: number;
  subtitle: string | null;
  page_number: number;
  content: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export class AdminService {
  // Chapter Management
  static async getAllChapters(): Promise<Chapter[]> {
    return DBService.getAll<Chapter>('SELECT * FROM chapters ORDER BY order_index');
  }

  static async getChapter(id: number): Promise<Chapter | null> {
    return DBService.get<Chapter>('SELECT * FROM chapters WHERE id = ?', [id]);
  }

  static async createChapter(chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await DBService.exec(
      `INSERT INTO chapters (title, summary, content, audio_url, order_index) 
       VALUES (?, ?, ?, ?, ?)`,
      [chapter.title, chapter.summary, chapter.content, chapter.audio_url, chapter.order_index]
    );
    return (result as any).lastInsertRowid as number;
  }

  static async updateChapter(id: number, chapter: Partial<Omit<Chapter, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (chapter.title !== undefined) {
      fields.push('title = ?');
      values.push(chapter.title);
    }
    if (chapter.summary !== undefined) {
      fields.push('summary = ?');
      values.push(chapter.summary);
    }
    if (chapter.content !== undefined) {
      fields.push('content = ?');
      values.push(chapter.content);
    }
    if (chapter.audio_url !== undefined) {
      fields.push('audio_url = ?');
      values.push(chapter.audio_url);
    }
    if (chapter.order_index !== undefined) {
      fields.push('order_index = ?');
      values.push(chapter.order_index);
    }
    
    if (fields.length === 0) {
      return; // Nothing to update
    }
    
    values.push(id);
    
    await DBService.exec(
      `UPDATE chapters SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async deleteChapter(id: number): Promise<void> {
    await DBService.exec('DELETE FROM chapters WHERE id = ?', [id]);
  }

  // Question Management
  static async getChapterQuestions(chapterId: number): Promise<Question[]> {
    return DBService.getAll<Question>(
      'SELECT * FROM questions WHERE chapter_id = ? ORDER BY order_index',
      [chapterId]
    );
  }

  static async createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<number> {
    const result = await DBService.exec(
      'INSERT INTO questions (chapter_id, text, order_index) VALUES (?, ?, ?)',
      [question.chapter_id, question.text, question.order_index]
    );
    return (result as any).lastInsertRowid as number;
  }

  static async updateQuestion(id: number, question: Partial<Omit<Question, 'id' | 'created_at'>>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (question.text !== undefined) {
      fields.push('text = ?');
      values.push(question.text);
    }
    if (question.order_index !== undefined) {
      fields.push('order_index = ?');
      values.push(question.order_index);
    }
    
    values.push(id);
    
    await DBService.exec(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async deleteQuestion(id: number): Promise<void> {
    await DBService.exec('DELETE FROM questions WHERE id = ?', [id]);
  }

  static async reorderQuestions(chapterId: number, questionIds: number[]): Promise<void> {
    await DBService.exec('BEGIN TRANSACTION');
    
    try {
      for (let i = 0; i < questionIds.length; i++) {
        await DBService.exec(
          'UPDATE questions SET order_index = ? WHERE id = ? AND chapter_id = ?',
          [i, questionIds[i], chapterId]
        );
      }
      await DBService.exec('COMMIT');
    } catch (error) {
      await DBService.exec('ROLLBACK');
      throw error;
    }
  }

  // Audio file handling (store as base64 or reference)
  static async uploadAudioFile(file: File): Promise<string> {
    // For now, store as data URL. In production, you might want to upload to a CDN
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Chapter Pages Management
  static async getChapterPages(chapterId: number): Promise<ChapterPage[]> {
    return DBService.getAll<ChapterPage>(
      'SELECT * FROM chapter_pages WHERE chapter_id = ? ORDER BY order_index',
      [chapterId]
    );
  }

  static async getChapterPage(pageId: number): Promise<ChapterPage | null> {
    return DBService.get<ChapterPage>('SELECT * FROM chapter_pages WHERE id = ?', [pageId]);
  }

  static async createChapterPage(page: Omit<ChapterPage, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await DBService.exec(
      `INSERT INTO chapter_pages (chapter_id, subtitle, page_number, content, order_index) 
       VALUES (?, ?, ?, ?, ?)`,
      [page.chapter_id, page.subtitle, page.page_number, page.content, page.order_index]
    );
    return (result as any).lastInsertRowid as number;
  }

  static async updateChapterPage(id: number, page: Partial<Omit<ChapterPage, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (page.subtitle !== undefined) {
      fields.push('subtitle = ?');
      values.push(page.subtitle);
    }
    if (page.page_number !== undefined) {
      fields.push('page_number = ?');
      values.push(page.page_number);
    }
    if (page.content !== undefined) {
      fields.push('content = ?');
      values.push(page.content);
    }
    if (page.order_index !== undefined) {
      fields.push('order_index = ?');
      values.push(page.order_index);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await DBService.exec(
      `UPDATE chapter_pages SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async deleteChapterPage(id: number): Promise<void> {
    await DBService.exec('DELETE FROM chapter_pages WHERE id = ?', [id]);
  }

  static async reorderChapterPages(chapterId: number, pageIds: number[]): Promise<void> {
    await DBService.exec('BEGIN TRANSACTION');
    
    try {
      for (let i = 0; i < pageIds.length; i++) {
        await DBService.exec(
          'UPDATE chapter_pages SET order_index = ? WHERE id = ? AND chapter_id = ?',
          [i, pageIds[i], chapterId]
        );
      }
      await DBService.exec('COMMIT');
    } catch (error) {
      await DBService.exec('ROLLBACK');
      throw error;
    }
  }

  // Page Read Progress
  static async markPageAsRead(chapterId: number, pageId: number): Promise<void> {
    await DBService.exec(
      `INSERT OR REPLACE INTO page_read_progress (chapter_id, page_id, is_read, read_at) 
       VALUES (?, ?, 1, CURRENT_TIMESTAMP)`,
      [chapterId, pageId]
    );
  }

  static async getPageReadProgress(chapterId: number): Promise<{ page_id: number; is_read: number }[]> {
    return DBService.getAll<{ page_id: number; is_read: number }>(
      'SELECT page_id, is_read FROM page_read_progress WHERE chapter_id = ?',
      [chapterId]
    );
  }
}
