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
import { DatabaseService, DiaryEntry } from '../../services/database.service';


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
    private dbService: DatabaseService,
  ) {
    addIcons({ save, trash, arrowBackOutline, closeCircleOutline, imageOutline });
  }

  async ngOnInit() {
    await AdMob.hideBanner();

    this.id = Number(this.route.snapshot.paramMap.get('id'));

    if (this.id !== NEW_ARTICLE) {
      // 既存記事を取得
      const allDiary = await this.dbService.getAll();
      const entry = allDiary.find(e => e.id === this.id);
      if (entry) {
        this.txt = entry.content;
        this.tags = entry.tags;
        this.date = entry.date;
      }
    } else {
      // 新規作成：年タグを自動付与
      const yearTag = this.date.getFullYear().toString();
      this.tags.push({ name: yearTag, editable: false });
    }

    // 初期内容を反映
    const editor = document.getElementById('editor');
    if (editor) {
      editor.innerHTML = this.txt;
    }
  }

  // =====================================
  // 💾 保存
  // =====================================
  async save() {
    const editor = document.getElementById('editor');
    if (editor) this.txt = editor.innerHTML;

    const entry: DiaryEntry = {
      id: this.id,
      content: this.txt,
      tags: this.tags,
      date: this.date
    };

    try {
      if (this.id === NEW_ARTICLE) {
        const newId = await this.dbService.insertDiary(entry);
        if (newId && newId > 0) this.id = newId; // ← 新しいIDを更新
      } else {
        await this.dbService.updateDiary(entry);
      }

      this.isSaved = true;
      await this.showToast('保存しました！', 'success');
    } catch (err) {
      console.error('保存エラー:', err);
      await this.showToast('保存に失敗しました！', 'danger');
    }
  }

  // =====================================
  // 🗑 削除
  // =====================================
  async delete() {
    const prompt = await this.alertController.create({
      header: '日記を削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: async _ => {
            if (this.id !== NEW_ARTICLE) {
              await this.dbService.delete(this.id);
            }
            await this.showToast('日記を削除しました！', 'success');
            this.nav.pop();
          }
        }
      ]
    });
    prompt.present();
  }

  // =====================================
  // 🔙 戻る
  // =====================================
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
              this.nav.pop();
            }
          }
        ]
      });
      prompt.present();
    }
    else {
      this.nav.pop();
    }
  }

  // =====================================
  // 🏷 タグ処理
  // =====================================
  public async detectChangeTag(event: CustomEvent) {
    const value = event.detail.value.trim();
    if (value.length > 0 && !this.tags.some(t => t.name === value)) {
      this.tags.push({ name: value, editable: true });
    }
    this.inputTag = "";

    // 既存記事の編集時は変更を保存
    if (this.id !== NEW_ARTICLE) {
      const entry: DiaryEntry = {
        id: this.id,
        content: this.txt,
        tags: this.tags,
        date: this.date
      };
      await this.dbService.updateDiary(entry);
      await this.showToast('保存しました！', 'success');
    }
  }

  detectChangeText() {
    this.isSaved = false;
  }

  async removeTag(i: number) {
    this.tags.splice(i, 1);
    // 既存記事の編集時は変更を保存
    if (this.id !== NEW_ARTICLE) {
      const entry: DiaryEntry = {
        id: this.id,
        content: this.txt,
        tags: this.tags,
        date: this.date
      };
      await this.dbService.updateDiary(entry);
      await this.showToast('保存しました！', 'success');
    }
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

  // =====================================
  // 🖼 画像挿入
  // =====================================
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
