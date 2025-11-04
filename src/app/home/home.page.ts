import { Component, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, NavController, IonFab,
  IonFabButton, IonIcon, IonMenu, IonListHeader, IonButtons, IonMenuButton, IonMenuToggle, IonChip,
  AlertController, IonButton, MenuController,
  IonSearchbar
} from '@ionic/angular/standalone';
import { DatePipe, SlicePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { add, searchOutline } from 'ionicons/icons';
import { LongPressDirective } from './long-press.directive';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdMobBannerSize, } from '@capacitor-community/admob';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';


// --- DiaryEntry インターフェース ---
interface DiaryEntry {
  id: number;
  content: string;
  tags: ({ name: string, editable: boolean })[];
  date: Date;
}
interface AppData {
  version: number;
  diary: DiaryEntry[];
}
const CURRENT_VERSION = 1; // //appDataのバージョン
const NEW_ARTICLE: number = -1;    //新規作成時を意味するid

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel,
    IonFab, IonFabButton, IonIcon, IonMenu, IonListHeader, IonButtons, IonMenuButton, IonMenuToggle,
    IonChip, IonButton, LongPressDirective, DatePipe, SlicePipe, IonSearchbar, FormsModule],
})
export class HomePage implements OnInit {
  allDiary: DiaryEntry[] = [];
  diary: DiaryEntry[] = [];  // 表示用
  selectedTags: string[] = [];  // 選択されたタグ一覧
  uniqueTags: { name: string, editable: boolean }[] = [];  // タグ一覧
  tagStyles = new Map<string, { color: string; outline: boolean }>();
  searchWord: string = '';  // ワード検索用の変数
  showSearchBar: boolean = false; //  検索バーの表示フラグ
  weekDay = ["日", "月", "火", "水", "木", "金", "土"];



  constructor(
    public nav: NavController,
    public alertController: AlertController,
    private menuController: MenuController,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ add, searchOutline });
    // ionViewWillEnterで初期化すると編集画面からの遷移時に発火しないため、手動で初期化
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.urlAfterRedirects === '/tabs/home') {
          // 初期化メソッド
          this.initHomePage();
        }
      });
  }

  ngOnInit() {
    AdMob.addListener(
      BannerAdPluginEvents.SizeChanged,
      (size: AdMobBannerSize) => {
        const fab = document.querySelector('ion-fab');
        if (fab) {
          // IonFab のパディング変数を更新
          (fab as HTMLElement).style.setProperty('padding-bottom', `${size.height}px`);
        }
        const content = document.getElementById('diary-list');
        if (content) {
          // IonList のパディング変数を更新
          (content as HTMLElement).style.setProperty('padding-bottom', `${size.height}px`);
        }
      }
    );
  }

  async ionViewDidEnter() {
    // ionViewDidEnterでタブバー描画後にマージンを設定してバナーを表示
    const tabBar = document.querySelector('ion-tab-bar');
    const options: BannerAdOptions = {
      adId: environment.admob.bannerId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: tabBar ? tabBar.clientHeight : 0,
    };
    await AdMob.showBanner(options);
  }

  async ionViewWillLeave() {
    await AdMob.hideBanner();
  }

  initHomePage() {
    // ローカルストレージからデータを取得
    this.getAppData();

    //  タグや検索ワードをリセット
    this.selectedTags = [];
    this.searchWord = '';

    // 描画完了後に広告を再開（自然なタイミング）
    setTimeout(() => {
      AdMob.resumeBanner();
    }, 400);
  }

  getAppData() {
    const data = localStorage.getItem('appData');
    if (data) {
      // ストレージから日記データをコピー
      const appData = JSON.parse(data) as AppData;
      this.allDiary = appData.diary;
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



  getUniqueTags(entries: DiaryEntry[]) {
    const map = new Map<string, { name: string, editable: boolean }>();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        map.set(tag.name, { name: tag.name, editable: tag.editable });
      }
    }
    this.uniqueTags = Array.from(map.values());
  }

  initTagStyles() {
    this.tagStyles.clear();
    this.uniqueTags.forEach(tag => {
      const tagColor = tag.editable ? 'primary' : 'uneditable';
      this.tagStyles.set(tag.name, { color: tagColor, outline: true });
    });
  }

  updateTagStyles() {
    this.tagStyles.clear();
    this.uniqueTags.forEach(tag => {
      const tagColor = tag.editable ? 'primary' : 'uneditable';
      const isSelected = this.selectedTags.includes(tag.name);
      this.tagStyles.set(tag.name, { color: tagColor, outline: !isSelected });
    });
  }

  addArticle() {
    this.nav.navigateForward('/edit-page/' + NEW_ARTICLE);
  }

  goEdit(id: number) {
    this.nav.navigateForward('/edit-page/' + id);
  }


  searchEntries(): DiaryEntry[] {
    let result = [...this.allDiary];

    // --- タグ検索（選択タグがある場合のみ絞り込み） ---
    if (this.selectedTags.length > 0) {
      result = result.filter(entry =>
        this.selectedTags.every(tag => entry.tags.some(t => t.name === tag))  // 選択されたタグの全てを含む
      );
    }

    // --- ワード検索（content と tags の両方を対象） ---
    if (this.searchWord.trim() !== '') {
      const lowerWord = this.searchWord.toLowerCase();
      result = result.filter(entry =>
        // 本文に含まれる
        entry.content.toLowerCase().includes(lowerWord) ||
        // タグのどれかに含まれる
        entry.tags.some(tag => tag.name.toLowerCase().includes(lowerWord))
      );
    }

    return result;
  }

  onSearchChange() {
    this.diary = this.searchEntries();
  }

  toggleSearchBar() {
    this.showSearchBar = !this.showSearchBar;
    if (!this.showSearchBar) {
      // 検索窓を閉じたら検索をリセット
      this.searchWord = '';
      this.diary = this.searchEntries();
    }
  }

  toggleTag(t: string, event?: Event) {
    if (event !== undefined) event.stopPropagation(); // クリックイベントの伝播を停止
    // タグスタイルを反転
    this.tagStyles.set(t, { color: this.tagStyles.get(t)?.color as string, outline: !this.tagStyles.get(t)?.outline });

    if (!this.tagStyles.get(t)?.outline) {
      // outline:falseの場合、タグ選択を有効化
      if (!this.selectedTags.includes(t)) {
        this.selectedTags.push(t);
      }
    } else {
      this.selectedTags = this.selectedTags.filter(tag => tag !== t);
    }

    this.diary = this.searchEntries();
  }


  async deleteEntry(id: number) {
    // 削除する記事のallDiary配列上の添字をidから取得
    const index = this.allDiary.findIndex(entry => entry.id === id);
    if (index === -1) return;
    // 記事内容を取得
    const txt: string = this.getPlainText(this.allDiary[index].content);
    const d: string = txt.substring(0, 12) + (txt.length > 12 ? '...' : '');
    const prompt = await this.alertController.create({
      header: '日記「' + d + '」を削除しますか？',
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
            this.selectedTags = this.selectedTags.filter(tag => this.uniqueTags.some(t => t.name === tag));
            // 選択タグが更新されたので、タグスタイルを更新
            this.updateTagStyles();
            // 再検索
            this.diary = this.searchEntries();
            // 変更をStorageに保存
            this.saveAppData();
          }
        }
      ]
    });
    await prompt.present();
  }

  async deleteTag(t: string, editable: boolean, id: number) {
    if (!editable) return; // 編集不可タグは削除しない
    // タグを削除する記事のallDiary配列上の添字をidから取得
    const index = this.allDiary.findIndex(entry => entry.id === id);
    if (index === -1) return;
    // 記事内容を取得
    const txt: string = this.getPlainText(this.allDiary[index].content);
    const d: string = txt.substring(0, 12) + (txt.length > 12 ? '...' : '');
    const prompt = await this.alertController.create({
      header: 'タグ「' + t + '」を日記「' + d + '」から削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: _ => {
            // タグを記事から削除
            this.allDiary[index].tags = this.allDiary[index].tags.filter(tag => tag.name !== t);
            // タグ一覧を更新
            this.getUniqueTags(this.allDiary);
            // タグ一覧が更新されたので、選択タグも更新
            this.selectedTags = this.selectedTags.filter(tag => this.uniqueTags.some(t => t.name === tag));
            // 選択タグが更新されたので、タグスタイルを更新
            this.updateTagStyles();
            // 再検索
            this.diary = this.searchEntries();
            // 変更をStorageに保存
            this.saveAppData();
          }
        }
      ]
    });
    await prompt.present();
  }

  async renameUniqueTag(t: string, editable: boolean) {
    if (!editable) return; // 編集不可タグはリネームしない
    await this.menuController.close();
    const prompt = await this.alertController.create({
      header: '新しいタグ名を入力してください',
      inputs: [
        {
          name: 'tagName',
          type: 'text',
          value: t,
          placeholder: 'タグ名'
        }
      ],
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '変更',
          handler: data => {
            if (!data.tagName || data.tagName.trim().length === 0) {
              this.deleteUniqueTag(t); // 空文字なら削除
              return;
            }
            // タグ名を全記事で置換
            for (let i: number = 0; i < this.allDiary.length; i++) {
              this.allDiary[i].tags = this.allDiary[i].tags.map(tag =>
                tag.name === t ? { name: data.tagName.trim(), editable: tag.editable } : tag
              );
            }
            // タグ一覧を更新
            this.getUniqueTags(this.allDiary);
            // 選択タグをクリア
            this.selectedTags = [];
            // タグスタイルを更新
            this.updateTagStyles();
            //　表示記事を更新
            this.diary = [...this.allDiary];
            // 変更をStorageに保存
            this.saveAppData();
          }
        }
      ]
    });
    await prompt.present();
  }

  async deleteUniqueTag(t: string) {
    const prompt = await this.alertController.create({
      header: 'タグ「' + t + '」を削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: _ => {
            // タグを全記事から削除
            for (let i: number = 0; i < this.allDiary.length; i++) {
              this.allDiary[i].tags = this.allDiary[i].tags.filter(tag => tag.name !== t);
            }
            // タグ一覧を更新
            this.getUniqueTags(this.allDiary);
            // 選択タグをクリア
            this.selectedTags = [];
            // タグスタイルを更新
            this.updateTagStyles();
            //　表示記事を更新
            this.diary = [...this.allDiary];
            // 変更をStorageに保存
            this.saveAppData();
          }
        }
      ]
    });
    await prompt.present();
  }

  saveAppData() {
    const appData: AppData = {
      version: CURRENT_VERSION,
      diary: this.allDiary
    };
    localStorage.setItem("appData", JSON.stringify(appData));
  }
}
