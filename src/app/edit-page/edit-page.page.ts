import { Component, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  RouterLink, ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonItem, IonInput, 
         IonButton, IonIcon, AlertController, NavController, IonTextarea, IonChip, IonLabel,
         ToastController  } from '@ionic/angular/standalone';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { save, trash, arrowBackOutline, closeCircleOutline, imageOutline } from 'ionicons/icons';
import { AdMob } from '@capacitor-community/admob';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { PreserveWhiteSpace } from '../quill-modules/preserve-whitespace-module';
import Quill from 'quill';
import { QuillModule } from 'ngx-quill';

// --- DiaryEntry インターフェース ---
interface DiaryEntry {
  id: number;
  content: string;
  tags: ({name: string, editable: boolean})[];
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
            IonItem, IonInput, IonButton, IonIcon, RouterLink,  IonTextarea, IonChip, IonLabel,
            DatePipe, QuillModule,]
})


export class EditPagePage implements OnInit {

  diary: DiaryEntry[] = [];
  id: number;           //編集する日記のid
  index: number = -1;        //編集する日記の配列上の添字
  txt: string = "a";           //表示テキスト
  tags: ({name: string, editable: boolean})[] = [];   //表示タグ
  inputTag: string = "";    //入力タグ
  date: Date = new Date();         //最初に編集を開始した日時
  weekDay = ["日", "月", "火", "水", "木", "金", "土"];
  quill!: Quill;

  constructor(
    private route: ActivatedRoute,
    public alertController: AlertController,
    private nav: NavController,
    public toastController: ToastController,
  ) {
    addIcons({save, trash, arrowBackOutline, closeCircleOutline, imageOutline});
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
      this.setContent(this.diary[this.index].content);
      this.tags = this.diary[this.index].tags;
      this.date = this.diary[this.index].date;
    } else {
      // 日時を取得
      this.date = new Date();
      // 年タグを自動追加
      this.tags.push({name: this.date.getFullYear().toString(), editable: false});
    }
  }

  ngAfterViewInit() {
    this.quill = new Quill('#editor', {
      modules: {
        toolbar: false,  // ツールバーは非表示
        preserveWhiteSpace: true, // ←ここでモジュールを有効化
      },
      theme: 'snow'
    });
  }

  ionViewWillEnter() {
  }
  

  async save() {
    let html = this.getContent();

    // Base64画像を抽出（JPEGとPNG両対応）
    const imgRegex = /<img src="data:image\/(jpeg|png);base64,([\s\S]+?)">/g;
    let match;
    let index = 0;

    while ((match = imgRegex.exec(html)) !== null) {
      const type = match[1];         // jpeg or png
      const base64 = match[2];       // Base64本体
      const ext = type === 'jpeg' ? 'jpeg' : 'png';
      const fileName = `img_${Date.now()}_${index}.${ext}`;

      // ファイル保存
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Data,
      });

      // 保存したファイルの絶対URIを取得
      const fileUri = await Filesystem.getUri({
        directory: Directory.Data,
        path: fileName
      });

      // Quill で参照できる形に変換
      const fileSrc = Capacitor.convertFileSrc(fileUri.uri);

      // HTML 内の src を置き換え
      html = html.replace(match[0], `<img src="${fileSrc}">`);
      index++;
    }

    // 本文に置き換え済み HTML を保存
    this.setContent(html);
    // 日記配列に保存
    if (this.id === NEW_ARTICLE) {
      const newid = this.diary.length > 0
        ? Math.max(...this.diary.map(d => d.id)) + 1
        : 0;
      this.diary.unshift({ content: this.getContent(), tags: this.tags, date: this.date, id: newid });
      this.id = newid;
      this.index = 0;
    } else {
      this.diary[this.index].content = this.getContent();
      this.diary[this.index].tags = this.tags;
    }

    // Storage に保存
    this.saveAppData();

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
            this.nav.navigateBack('/home');
          }
        }
      ]
    });
    prompt.present();
  }

  public async detectChangeTag(event: CustomEvent) {
    const value = event.detail.value.trim();
    if (value.length > 0 && !this.tags.some(t => t.name === value)) {
      this.tags.push({name: value, editable: true});
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

  // --- カメラロールから画像を挿入 ---
  async insertImage() {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.Base64
      });

      if (!photo.base64String) return;

      const imgUrl = `data:image/jpeg;base64,${photo.base64String}`;

      // カーソル位置取得
      const range = this.quill.getSelection();
      const index = range ? range.index : this.quill.getLength();

      // 画像を挿入
      this.quill.insertEmbed(index, 'image', imgUrl);

      // カーソルを画像の後に移動
      this.quill.setSelection(index + 1);

    } catch (err) {
      console.error('画像挿入エラー:', err);
    }
  }

  getContent(): string {
    return this.quill ? this.quill.root.innerHTML : '';
  }

  setContent(content: string) {
    if (this.quill) {
      this.quill.root.innerHTML = content;
    }
  }
}
