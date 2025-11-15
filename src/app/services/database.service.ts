import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface DBEntry {
  id: number;
  content: string;
  tags: string; // JSON 文字列（[{ name, editable }]）
  date: string; // ISO文字列
}

export interface DiaryEntry {
  id: number;
  content: string;
  tags: { name: string; editable: boolean }[];
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private initInProgress = false;
  private initialized = false;
  // 外部から初期化の完了を待てる Promise
  private initPromise: Promise<void> | null = null;

  private readonly DB_NAME = 'diaryDB';
  private readonly DB_VERSION = 1;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }



  // ==============================
  // ✅ 外部から DB ready を待機する
  // ==============================
  async waitForReady() {
    if (!this.initialized) {
      await this.initDB();
    }
  }

  // ==============================
  // ✅ DBが確実に存在することを保証
  // ==============================
  private ensureDb(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database not initialized. Call initDB() first.');
    }
    return this.db;
  }

  // ==============================
  // ✅ データベースを初期化（再利用対応）
  // ==============================
  async initDB() {
    // すでに初期化済みなら即リターン
    if (this.initialized) return;

    // 多重呼び出し防止
    if (this.initInProgress) return this.initPromise;

    this.initInProgress = true;

    this.initPromise = (async () => {
      try {
        let dbOpen = false;
        if (this.db) {
          try {
            dbOpen = (await this.db.isDBOpen()).result ?? false;
          } catch {
            console.warn('[DB] isDBOpen failed — resetting connection');
            dbOpen = false;
          }
        }

        if (!dbOpen) {
          try {
            await this.sqlite.checkConnectionsConsistency();
          } catch (err) {
            console.warn('[DB] Consistency check failed, resetting:', err);
            await this.sqlite.closeAllConnections();
          }

          const isConn = (await this.sqlite.isConnection(this.DB_NAME, false)).result;

          if (isConn) {
            this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
            if (!((await this.db.isDBOpen()).result ?? false)) {
              await this.db.open();
            }
          } else {
            this.db = await this.sqlite.createConnection(
              this.DB_NAME, false, 'no-encryption', this.DB_VERSION, false
            );
            await this.db.open();
          }
        }

        const db = this.ensureDb();
        await db.execute(`
        CREATE TABLE IF NOT EXISTS diary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT,
          tags TEXT,
          date TEXT
        );
      `);

        this.initialized = true;
        console.log('[DB] Database initialized successfully');
      } catch (err) {
        console.error('❌ Database initialization failed:', err);
        try {
          await this.sqlite.closeAllConnections();
          console.log('[DB] Closed all stale connections. Retrying...');
          this.db = await this.sqlite.createConnection(
            this.DB_NAME, false, 'no-encryption', this.DB_VERSION, false
          );
          await this.db.open();
          this.initialized = true;
          console.log('[DB] Database reinitialized successfully');
        } catch (err2) {
          console.error('💥 DB reinitialization failed:', err2);
          throw new Error('DB init retry failed.'); // 上層でcatch
        }
      } finally {
        this.initInProgress = false;
      }
    })();

    return this.initPromise;
  }

  // ==============================
  // 📖 全件取得（最新日付順）
  // ==============================
  async getAll(): Promise<DiaryEntry[]> {
    const db = this.ensureDb();
    const res = await db.query('SELECT * FROM diary ORDER BY date DESC;');
    const dbEntries = (res.values ?? []) as DBEntry[];
    return dbEntries.map(e => this.convertFromDBEntry(e));
  }

  // ==============================
  // 📝 1件追加
  // ==============================
  async insertDiary(entry: DiaryEntry): Promise<number> {
    const db = this.ensureDb();
    const e = this.convertToDBEntry(entry);
    const res = await db.run(
      `INSERT INTO diary (content, tags, date) VALUES (?, ?, ?);`,
      [e.content, e.tags, e.date]
    );
    const newId = res.changes?.lastId;
    if (!newId || newId < 1) {
      throw new Error('Failed to insert diary entry (no valid ID returned)');
    }
    return newId;
  }

  // ==============================
  // ✏️ 1件更新
  // ==============================
  async updateDiary(entry: DiaryEntry) {
    const db = this.ensureDb();
    const e = this.convertToDBEntry(entry);
    await db.run(
      `UPDATE diary SET content = ?, tags = ?, date = ? WHERE id = ?;`,
      [e.content, e.tags, e.date, e.id]
    );
  }

  // ==============================
  // 🔄 複数件をまとめて更新（高速）
  // ==============================
  async bulkUpdateFast(entries: DiaryEntry[]) {
    const db = this.ensureDb();
    const set = entries.map(e => {
      const dbE = this.convertToDBEntry(e);
      return {
        statement: `UPDATE diary SET content = ?, tags = ?, date = ? WHERE id = ?;`,
        values: [dbE.content, dbE.tags, dbE.date, dbE.id],
      };
    });
    await db.executeSet(set);
  }

  // ==============================
  // 🗑️ 1件削除
  // ==============================
  async delete(id: number) {
    const db = this.ensureDb();
    await db.run(`DELETE FROM diary WHERE id = ?;`, [id]);
  }

  // ==============================
  // 🧹 全削除
  // ==============================
  async clear() {
    const db = this.ensureDb();
    await db.run('DELETE FROM diary;');
  }

  // ==============================
  // ✅ DBを安全に閉じる
  // ==============================
  async close() {
    if (!this.db) return;

    try {
      const isOpen = (await this.db.isDBOpen()).result;
      if (isOpen) {
        await this.db.close();
      }
    } catch (e) {
      console.warn('[DB] db.close() failed:', e);
    }

    try {
      const isConn = (await this.sqlite.isConnection(this.DB_NAME, false)).result;
      if (isConn) {
        await this.sqlite.closeConnection(this.DB_NAME, false);
      }
    } catch (e) {
      console.warn('[DB] closeConnection() failed:', e);
    }

    try {
      await this.sqlite.checkConnectionsConsistency();
    } catch {
      // 破損状態なら強制リセット
      await this.sqlite.closeAllConnections();
    }

    this.db = null;
    this.initialized = false;
    console.log('[DB] Connection fully closed.');
  }

  // ==============================
  // 🔍 DBの有効性チェック
  // ==============================
  async isDbOpen(): Promise<boolean> {
    if (!this.db) return false;
    try {
      return (await this.db.isDBOpen())?.result ?? false;
    } catch {
      return false;
    }
  }

  // ==============================
  // 🔄 データ型変換メソッド
  // ==============================
  private convertToDBEntry(entry: DiaryEntry): DBEntry {
    return {
      id: entry.id,
      content: entry.content,
      tags: JSON.stringify(entry.tags),
      date: entry.date.toISOString(),
    };
  }

  private convertFromDBEntry(dbEntry: DBEntry): DiaryEntry {
    return {
      id: dbEntry.id,
      content: dbEntry.content,
      tags: JSON.parse(dbEntry.tags),
      date: new Date(dbEntry.date),
    };
  }

  // ==============================
  // 💾 データ全件を書き出し（JSON文字列）
  // ==============================
  async exportAll(): Promise<string> {
    const db = this.ensureDb();

    const res = await db.query('SELECT * FROM diary ORDER BY date DESC;');
    const entries: DBEntry[] = res.values ?? [];

    // 整形済みJSONで返す（改行＆インデントあり）
    return JSON.stringify(entries, null, 2);
  }

  // ==============================
  // 📥 JSONからデータを読み込み（上書き／追加）
  // ==============================
  async importFromJson(json: string, overwrite = false): Promise<void> {
    const db = this.ensureDb();

    let parsed: DBEntry[];
    try {
      parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid JSON format: expected array');
      }
    } catch (err) {
      throw new Error('JSONパースに失敗しました: ' + err);
    }

    // --- 詳細ログを入れて原因を追いやすくする
    console.log('DB LOG: BEGIN TRANSACTION');
    await db.execute('BEGIN TRANSACTION');

    try {
      if (overwrite) {
        console.log('DB LOG: DELETE FROM diary (overwrite)');
        await db.execute('DELETE FROM diary');
      }

      const statements = parsed.map(e => ({
        statement: `
        INSERT OR IGNORE INTO diary (id, content, tags, date)
        VALUES (?, ?, ?, ?)
      `,
        values: [e.id, e.content, e.tags, e.date]
      }));

      console.log('DB LOG: executeSet');
      await db.executeSet(statements);
      console.log(`[DB] import完了: ${parsed.length} 件`);
    } catch (err) {
      try {
        console.log('DB LOG: ROLLBACK');
        await db.execute('ROLLBACK');
      } catch (rbErr) {
        console.warn('DB LOG: ROLLBACK failed or no transaction:', rbErr);
      }
      console.error('❌ import失敗:', err);
      throw err;
    }
  }

}
