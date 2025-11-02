import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonItem, IonInput,
  IonButton, IonIcon, AlertController, NavController, IonChip, IonLabel,
  ToastController
} from '@ionic/angular/standalone';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { save, trash, arrowBackOutline, closeCircleOutline, imageOutline } from 'ionicons/icons';
import { AdMob } from '@capacitor-community/admob';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';

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
const CURRENT_VERSION = 1;  //appDataのバージョン
const NEW_ARTICLE: number = -1;    //新規作成時を意味するid

@Component({
  selector: 'app-edit-page',
  templateUrl: './edit-page.page.html',
  styleUrls: ['./edit-page.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons,
    IonItem, IonInput, IonButton, IonIcon, IonChip, IonLabel,
    DatePipe,]
})


export class EditPagePage implements OnInit {

  diary: DiaryEntry[] = [];
  id: number;           //編集する日記のid
  index: number = -1;        //編集する日記の配列上の添字
  txt: string = "";           //表示テキスト
  tags: ({ name: string, editable: boolean })[] = [];   //表示タグ
  inputTag: string = "";    //入力タグ
  date: Date = new Date();         //最初に編集を開始した日時
  weekDay = ["日", "月", "火", "水", "木", "金", "土"];
  isSaved: boolean = true;  //保存済みかどうかのフラグ
  isFocused = false;    // タグ入力欄にフォーカスしているかのフラグ

  constructor(
    private route: ActivatedRoute,
    public alertController: AlertController,
    private nav: NavController,
    public toastController: ToastController,
  ) {
    addIcons({ save, trash, arrowBackOutline, closeCircleOutline, imageOutline });
  }

  async ngOnInit() {
    await AdMob.hideBanner();

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    // ローカルストレージからデータを取得
    const data = localStorage.getItem('appData');

    if (data) {
      // ストレージから日記データをコピー
      const appData = JSON.parse(data) as AppData;
      this.diary = appData.diary;
      this.diary = this.diary.map(entry => ({
        ...entry,
        date: new Date(entry.date)
      }));
    }

    if (this.id !== NEW_ARTICLE) {
      for (let i: number = 0; i < this.diary.length; i++) {
        if (this.diary[i].id === this.id) this.index = i;
      }
      this.txt = this.diary[this.index].content;
      this.tags = this.diary[this.index].tags;
      this.date = this.diary[this.index].date;
    } else {
      // 日時を取得
      this.date = new Date();
      // 年タグを自動追加
      this.tags.push({ name: this.date.getFullYear().toString(), editable: false });
    }

    // 初期内容を反映
    const editor = document.getElementById('editor');
    if (editor) {
      editor.innerHTML = this.txt;
    }
  }

  ngAfterViewInit() {

  }

  ionViewWillEnter() {
  }


  async save() {
    const editor = document.getElementById('editor');
    if (editor) {
      this.txt = editor.innerHTML;  // HTMLを保存
    }

    // 日記配列に保存
    if (this.id === NEW_ARTICLE) {
      const newid = this.diary.length > 0
        ? Math.max(...this.diary.map(d => d.id)) + 1
        : 0;
      this.diary.unshift({ content: this.txt, tags: this.tags, date: this.date, id: newid });
      this.id = newid;
      this.index = 0;
    } else {
      this.diary[this.index].content = this.txt;
      this.diary[this.index].tags = this.tags;
    }

    // Storage に保存
    this.saveAppData();
    this.isSaved = true;

    // 保存完了トースト
    const toast = await this.toastController.create({
      message: '保存しました！',
      duration: 2000,
      color: 'light'
    });
    toast.present();
  }

  async delete() {
    const prompt = await this.alertController.create({
      header: '日記を削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: _ => {
            if (this.id !== NEW_ARTICLE) {
              this.diary.splice(this.index, 1);
              // 変更をStorageに保存
              this.saveAppData();
            }
            this.nav.navigateBack('/tabs/home');
          }
        }
      ]
    });
    prompt.present();
  }

  async goHome() {
    if (!this.isSaved) {
      const prompt = await this.alertController.create({
        header: '保存していない変更があります。変更を破棄して戻りますか？',
        buttons: [
          {
            text: 'キャンセル',
          },
          {
            text: '戻る',
            handler: _ => {
              this.nav.navigateBack('/tabs/home');
            }
          }
        ]
      });
      prompt.present();
    }
    else {
      this.nav.navigateBack('/tabs/home');
    }
  }

  public async detectChangeTag(event: CustomEvent) {
    const value = event.detail.value.trim();
    if (value.length > 0 && !this.tags.some(t => t.name === value)) {
      this.tags.push({ name: value, editable: true });
    }
    this.inputTag = "";

    // 既存記事の編集時は変更を保存
    if (this.id !== NEW_ARTICLE) {
      this.diary[this.index].tags = this.tags;
      // 変更をStorageに保存
      this.saveAppData();
      // 保存完了のトーストを表示
      const toast = await this.toastController.create({
        message: '保存しました！',
        duration: 2000,
        color: 'light'
      });
      toast.present();
    }
  }

  detectChangeText() {
    this.isSaved = false;
  }

  removeTag(i: number) {
    this.tags.splice(i, 1);
    // 既存記事の編集時は変更を保存
    if (this.id !== NEW_ARTICLE) {
      this.diary[this.index].tags = this.tags;
      // 変更をStorageに保存
      this.saveAppData();
    }
  }

  saveAppData() {
    const appData: AppData = {
      version: CURRENT_VERSION,
      diary: this.diary
    };
    localStorage.setItem("appData", JSON.stringify(appData));
  }

  async insertImage() {
    const photo = await Camera.getPhoto({
      quality: 70,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos
    });

    const imgUrl = `data:image/jpeg;base64,${photo.base64String}`;
    const editor = document.getElementById('editor');  // 本文エディタのみ対象

    if (editor) {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.style.maxWidth = '100%';
      img.style.display = 'block';
      img.style.margin = '10px 0';

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
        // エディタ内にカーソルがある場合挿入
        const range = selection.getRangeAt(0);
        range.insertNode(img);
      } else {
        // カーソルがエディタ外なら末尾に挿入
        editor.appendChild(img);
      }
    }
  }
}
