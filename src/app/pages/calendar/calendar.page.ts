import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { DatabaseService, DiaryEntry } from '../../services/database.service';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonDatetime,
  IonList,
  IonListHeader,
  IonChip,
  NavController,
} from '@ionic/angular/standalone';

interface AppData {
  version: number;
  diary: DiaryEntry[];
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonDatetime,
    IonList,
    IonListHeader,
    IonChip,
  ],
})
export class CalendarPage {
  selectedDate: string | null = null;
  allDiary: DiaryEntry[] = [];
  filteredEntries: DiaryEntry[] = [];
  highlightedDates: { date: string; textColor?: string; backgroundColor?: string }[] = [];

  constructor(
    public nav: NavController,
    private router: Router,
    private dbService: DatabaseService,
    public toastController: ToastController,
  ) {
    // 編集ページなどから戻ったときに再読み込み
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.urlAfterRedirects === '/tabs/calendar') {
          this.initCalendarPage();
        }
      });
  }

  // =====================================
  // DBから日記をロード
  // =====================================
  async initCalendarPage() {
    // DB初期化を待つ
    await this.dbService.waitForReady();
    this.allDiary = await this.dbService.getAll();

    // 日記のある日をハイライト
    this.highlightedDates = this.allDiary.map((entry) => {
      const y = entry.date.getFullYear();
      const m = (entry.date.getMonth() + 1).toString().padStart(2, '0');
      const d = entry.date.getDate().toString().padStart(2, '0');
      return {
        date: `${y}-${m}-${d}`,
        backgroundColor: 'rgba(56, 128, 255, 0.30)',
        textColor: '#000',
      };
    });

    // 🔸 selectedDate が null または未選択ならフィルタしない
    if (!this.selectedDate) {
      this.filteredEntries = [];
      return;
    }

    // 🔸 selectedDate（string）から Date に変換して比較, 日記の表示を更新する
    const [year, month, day] = this.selectedDate.split('-').map(Number);
    const selected = new Date(year, month - 1, day);

    this.filteredEntries = this.allDiary.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === selected.getFullYear() &&
        entryDate.getMonth() === selected.getMonth() &&
        entryDate.getDate() === selected.getDate()
      );
    });
  }

  // =====================================
  // 日付選択時のフィルタリング
  // =====================================
  onDateChange(event: any) {
    const isoString: string = event.detail.value;
    if (!isoString) {
      this.filteredEntries = [];
      return;
    }

    const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
    const selected = new Date(year, month - 1, day);

    this.selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`;

    this.filteredEntries = this.allDiary.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === selected.getFullYear() &&
        entryDate.getMonth() === selected.getMonth() &&
        entryDate.getDate() === selected.getDate()
      );
    });
  }

  // =====================================
  // 編集ページに遷移
  // =====================================
  goEdit(id: number) {
    this.nav.navigateForward(`/edit-page/${id}`);
  }

  // =====================================
  // 日記データのhtmlタグを消去
  // =====================================
  getPlainText(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // img タグを削除
    doc.querySelectorAll('img').forEach(img => img.remove());
    // div タグは中身を残して、その後にスペースを追加
    doc.querySelectorAll('div').forEach(div => {
      const fragment = doc.createDocumentFragment();
      // 子要素（テキストやタグ）を全部移動
      while (div.firstChild) {
        fragment.appendChild(div.firstChild);
      }
      // 後ろにスペースを追加
      fragment.appendChild(doc.createTextNode(' '));
      // div を fragment で置き換える
      div.parentNode?.replaceChild(fragment, div);
    });

    // 残ったテキストを取得
    return doc.body.textContent || '';
  }

  // =====================================
  // トースト表示
  // =====================================
  private async showToast(message: string, color: 'success' | 'danger' | 'light' = 'light') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }
}
