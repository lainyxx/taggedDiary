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
  private db!: SQLiteDBConnection;

  private readonly DB_NAME = 'diaryDB';
  private readonly DB_VERSION = 1;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * ✅ データベースを初期化（再利用対応）
   */
  async initDB() {
    // すでに初期化済みなら即リターン（db が存在し、接続が開いている）
    if (this.db && (await this.db.isDBOpen()).result) {
      return;
    }

    // 一貫性チェック
    await this.sqlite.checkConnectionsConsistency();

    // 既存接続があるか確認
    const isConn = (await this.sqlite.isConnection(this.DB_NAME, false)).result;

    if (isConn) {
      // 既存接続を再利用
      this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
    } else {
      // 新規接続を作成（第5引数：readonly = false）
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,             // encrypted
        'no-encryption',   // mode
        this.DB_VERSION,   // version
        false              // readonly
      );
    }

    // DBオープン
    await this.db.open();

    // テーブル作成
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS diary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        tags TEXT,
        date TEXT
      );
    `);
  }

  /**
   * 全件取得（最新日付順）
   */
  async getAll(): Promise<DiaryEntry[]> {
    const res = await this.db.query('SELECT * FROM diary ORDER BY date DESC;');
    const dbEntries = (res.values ?? []) as DBEntry[];
    return dbEntries.map(e => this.convertFromDBEntry(e));
  }

  /**
   * 1件追加　
   */
  async insertDiary(entry: DiaryEntry): Promise<number> {
    const e = this.convertToDBEntry(entry);
    const res = await this.db.run(
      `INSERT INTO diary (content, tags, date) VALUES (?, ?, ?);`,
      [e.content, e.tags, e.date]
    );

    const newId = res.changes?.lastId;
    if (!newId || newId < 1) {
      throw new Error('Failed to insert diary entry (no valid ID returned)');
    }
    return newId;
  }

  /**
   * 1件更新
   */
  async updateDiary(entry: DiaryEntry) {
    const e = this.convertToDBEntry(entry);
    await this.db.run(
      `UPDATE diary SET content = ?, tags = ?, date = ? WHERE id = ?;`,
      [e.content, e.tags, e.date, e.id]
    );
  }

  /**
   * 🔄 複数件をまとめて更新（高速）
   */
  async bulkUpdateFast(entries: DiaryEntry[]) {
    const set = entries.map(e => {
      const dbE = this.convertToDBEntry(e);
      return {
        statement: `UPDATE diary SET content = ?, tags = ?, date = ? WHERE id = ?;`,
        values: [dbE.content, dbE.tags, dbE.date, dbE.id],
      };
    });

    await this.db.executeSet(set);
  }

  /**
   * 削除
   */
  async delete(id: number) {
    await this.db.run(`DELETE FROM diary WHERE id = ?;`, [id]);
  }

  /**
   * 全削除
   */
  async clear() {
    await this.db.run('DELETE FROM diary;');
  }

  /**
   * ✅ DBを安全に閉じる
   */
  async close() {
    const isConn = (await this.sqlite.isConnection(this.DB_NAME, false)).result;
    if (isConn) {
      await this.db.close();
      await this.sqlite.closeConnection(this.DB_NAME, false);
    }
  }


  /**
   * DBの有効性チェック
   */
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
}
