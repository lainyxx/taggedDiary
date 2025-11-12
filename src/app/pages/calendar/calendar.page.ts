import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { DatabaseService, DiaryEntry } from '../../services/database.service';
import { ToastService } from '../../services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
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
  IonSpinner,
} from '@ionic/angular/standalone';


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
    IonSpinner,
  ],
})
export class CalendarPage {
  selectedDate: string | null = null;
  allDiary: DiaryEntry[] = [];
  filteredEntries: DiaryEntry[] = [];
  highlightedDates: { date: string; textColor?: string; backgroundColor?: string }[] = [];
  isLoading: boolean = true;

  constructor(
    public nav: NavController,
    private router: Router,
    private dbService: DatabaseService,
    private toast: ToastService,
    private destroyRef: DestroyRef,
  ) {
    // 編集ページなどから戻ったときに再読み込み
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
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
    this.isLoading = true;
    try {
      // DB初期化を待つ
      await this.dbService.waitForReady();
      this.allDiary = await this.dbService.getAll();
    } catch (err) {
      console.error('[initCalendarPage] DB初期化または取得失敗:', err);
      this.allDiary = [];
      this.toast.show(
        'データベースの初期化に失敗しました。アプリを再起動してください。'
      );
    } finally {
      this.isLoading = false;
    }

    // 日記のある日をハイライト
    const uniqueDates = new Set<string>();
    this.highlightedDates = [];

    for (const entry of this.allDiary) {
      const dateObj = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      const y = dateObj.getFullYear();
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const d = dateObj.getDate().toString().padStart(2, '0');
      const iso = `${y}-${m}-${d}`;

      if (!uniqueDates.has(iso)) {
        uniqueDates.add(iso);
        this.highlightedDates.push({
          date: iso,
          backgroundColor: 'rgba(56, 128, 255, 0.30)',
          textColor: '#000',
        });
      }
    }

    this.filterBySelectedDate();
  }

  // TASK:必要か不明
  onDateChange(event: any) {
    const isoString: string = event.detail.value;
    if (!isoString) {
      this.filteredEntries = [];
      return;
    }

    const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
    this.selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`;

    this.filterBySelectedDate();
  }

  // =====================================
  // 日付選択時のフィルタリング
  // =====================================
  filterBySelectedDate() {
    if (!this.selectedDate) {
      this.filteredEntries = [];
      return;
    }

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
}
