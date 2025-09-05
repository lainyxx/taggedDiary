import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, NavController, IonFab,
         IonFabButton, IonIcon, IonMenu, IonListHeader, IonButtons, IonMenuButton, IonMenuToggle, IonChip,
        AlertController, IonButton, MenuController, IonCardTitle, IonCardHeader, IonCardContent, IonFooter } from '@ionic/angular/standalone';
import { DatePipe, SlicePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { add, searchOutline } from 'ionicons/icons';
import { LongPressDirective } from './long-press.directive';

// --- DiaryEntry インターフェース ---
interface DiaryEntry {
  id: number;
  content: string;
  tags: string[];
  date: Date;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, RouterLink,
            IonFab, IonFabButton, IonIcon, IonMenu, IonListHeader, IonButtons, IonMenuButton, IonMenuToggle,
            IonChip, IonButton, LongPressDirective, IonCardTitle, IonCardHeader, IonCardContent, DatePipe,
            SlicePipe, IonFooter],
})
export class HomePage implements OnInit {
  allDiary: DiaryEntry[] = [];
  diary: DiaryEntry[] = [];  // 表示用
  selectedTags: string[] = [];
  uniqueTags = new Set<string>([]);
  tagStyles = new Map<string, { color: string; outline: boolean }>();

  // testdate: string;

  constructor(
    public nav: NavController,
    private route: ActivatedRoute,
    public alertController: AlertController,
    private menuController: MenuController,
  ) {
    addIcons({ add, searchOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
      const data = localStorage.getItem('diary');
      if (data) {
        // ストレージから日記データをコピー
        this.allDiary = JSON.parse(localStorage.diary) as DiaryEntry[];
        // 文字列 → Date に変換
        this.allDiary = this.allDiary.map(entry => ({
          ...entry,
          date: new Date(entry.date)
        }));
        // 表示用変数に日記データをコピー
        this.diary = [...this.allDiary];
        // タグ一覧を取得
        this.getUniqueTags(this.allDiary);
        // タグスタイルを初期化
        this.initTagStyles();
      }
  }

  addArticle() {
    this.nav.navigateForward('/edit-page/-1');  // id:-1 は新規作成
  }

  getUniqueTags(entries: DiaryEntry[]) {
    this.uniqueTags.clear();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        this.uniqueTags.add(tag);
      }
    }
  }

  initTagStyles() {
    this.tagStyles.clear();
    this.uniqueTags.forEach(tag => {
      this.tagStyles.set(tag, { color: 'primary', outline: true });
    });
  }

  updateTagStyles() {
    this.tagStyles.clear();
    this.uniqueTags.forEach(tag => {
      if (this.selectedTags.includes(tag)) this.tagStyles.set(tag, { color: 'primary', outline: false });
      else this.tagStyles.set(tag, { color: 'primary', outline: true });
    });
  }

  get uniqueTagsArray(): string[] {
    return Array.from(this.uniqueTags);
  }

  toggleTag(t: string) {
    this.tagStyles.set(t, { color: 'primary', outline:!this.tagStyles.get(t)?.outline });

    if (!this.tagStyles.get(t)?.outline) {
      // outline:falseの場合、タグ選択を有効化
      if (!this.selectedTags.includes(t)) {
        this.selectedTags.push(t);
      }
    } else {
      this.selectedTags = this.selectedTags.filter(tag => tag !== t);
    }

    this.diary = this.searchEntries(this.selectedTags);
  }

  searchEntries(selectedTags: string[]): DiaryEntry[] {
    if (selectedTags.length === 0) return [...this.allDiary];

    return this.allDiary.filter(entry =>
      selectedTags.every(tag => entry.tags.includes(tag))
    );
  }

  async deleteEntry(id: number) {
    // 削除する記事のallDiary配列上の添字をidから取得 
    const index = this.allDiary.findIndex(entry => entry.id === id);
    if (index === -1) return;
    // 記事内容を取得
    const d: string = this.allDiary[index].content;
    const prompt = await this.alertController.create({
      header:  '日記"' + d + '"を削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: _ => {
            this.allDiary.splice(index, 1);
            // タグ一覧を更新
            this.getUniqueTags(this.allDiary);
            // タグ一覧が更新されたので、選択タグも更新
            this.selectedTags = this.selectedTags.filter(tag => this.uniqueTags.has(tag));
            // 選択タグが更新されたので、タグスタイルを更新し再検索
            this.updateTagStyles();
            this.diary = this.searchEntries(this.selectedTags);
            // Storageに保存
            localStorage.diary = JSON.stringify(this.allDiary);
          }
        }
      ]
    });
    await prompt.present();
  }

  async deleteTag(t: string, id: number) {
    // タグを削除する記事のallDiary配列上の添字をidから取得 
    const index = this.allDiary.findIndex(entry => entry.id === id);
    if (index === -1) return;
    // 記事内容を取得
    const d: string = this.allDiary[index].content;
    const prompt = await this.alertController.create({
      header:  'タグ"' + t + '"を"' + d +'"から削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: _ => {
            // タグを記事から削除
            this.allDiary[index].tags = this.allDiary[index].tags.filter(tag => tag !== t);
            // タグ一覧を更新
            this.getUniqueTags(this.allDiary);
            // タグ一覧が更新されたので、選択タグも更新
            this.selectedTags = this.selectedTags.filter(tag => this.uniqueTags.has(tag));
            // 選択タグが更新されたので、タグスタイルを更新し再検索
            this.updateTagStyles();
            this.diary = this.searchEntries(this.selectedTags);
            // Storageに保存
            localStorage.diary = JSON.stringify(this.allDiary);
          }
        }
      ]
    });
    await prompt.present();
  }

  async deleteUniqueTag(t: string) {
    await this.menuController.close();
    const prompt = await this.alertController.create({
      header:  'タグ"' + t + '"を削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: _ => {
            for (let i:number = 0; i < this.allDiary.length; i++) {
              this.allDiary[i].tags = this.allDiary[i].tags.filter(tag => tag !== t);
            }
            this.uniqueTags.delete(t);
            this.selectedTags = [];
            this.updateTagStyles();
            this.diary = [...this.allDiary];
            localStorage.diary = JSON.stringify(this.allDiary);
          }
        }
      ]
    });
    await prompt.present();
  }
}
