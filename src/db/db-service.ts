export class DBService {
  private static worker: Worker | null = null;
  private static pendingQueries: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private static isReady: Promise<void>;

  static init() {
    if (this.worker) return this.isReady;

    this.worker = new Worker(new URL('./db-worker.ts', import.meta.url), { type: 'module' });

    this.isReady = new Promise((resolve, reject) => {
      if (!this.worker) return reject('Worker failed to initialize');

      this.worker.onmessage = (e) => {
        const { id, type, result, error } = e.data;

        if (type === 'READY') {
          resolve();
          return;
        }

        if (type === 'ERROR' && !id) {
          reject(error);
          return;
        }

        const pending = this.pendingQueries.get(id);
        if (pending) {
          if (type === 'SUCCESS') {
            pending.resolve(result);
          } else {
            pending.reject(error);
          }
          this.pendingQueries.delete(id);
        }
      };

      this.worker.postMessage({ type: 'INIT' });
    });

    return this.isReady;
  }

  static async query<T>(type: 'exec' | 'get' | 'getAll', sql: string, params: unknown[] = []): Promise<T> {
    await this.isReady;
    const id = Math.random().toString(36).substring(7);

    return new Promise((resolve, reject) => {
      this.pendingQueries.set(id, { resolve, reject });
      this.worker?.postMessage({ id, type, payload: { sql, params } });
    });
  }

  static exec(sql: string, params: unknown[] = []) {
    return this.query<any[]>('exec', sql, params);
  }

  static get<T = any>(sql: string, params: unknown[] = []) {
    return this.query<T>('get', sql, params);
  }

  static getAll<T = any>(sql: string, params: unknown[] = []) {
    return this.query<T[]>('getAll', sql, params);
  }
}
