import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  RouterLink, ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonItem, IonInput, 
         IonButton, IonIcon, AlertController, NavController, IonTextarea, IonChip, IonLabel,
         ToastController  } from '@ionic/angular/standalone';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { save, trash, arrowBackOutline, closeCircleOutline } from 'ionicons/icons';
import { AdMob } from '@capacitor-community/admob';

// --- DiaryEntry インターフェース ---
interface DiaryEntry {
  id: number;
  content: string;
  tags: ({name: string, editable: boolean})[];
  date: Date;
}

@Component({
  selector: 'app-edit-page',
  templateUrl: './edit-page.page.html',
  styleUrls: ['./edit-page.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, 
            IonItem, IonInput, IonButton, IonIcon, RouterLink,  IonTextarea, IonChip, IonLabel, DatePipe]
})


export class EditPagePage implements OnInit {

  diary: DiaryEntry[] = [];
  txt: string = "";
  id: number;           //編集する日記のid
  newArticle: number = -1;    //新規作成時を意味するid
  index: number = -1;        //編集する日記の配列上の添字
  tags: ({name: string, editable: boolean})[] = [];
  inputTag: string = "";
  date: Date = new Date();         //最初に編集を開始した日時

  constructor(
    private route: ActivatedRoute,
    public alertController: AlertController,
    private nav: NavController,
    public toastController: ToastController,
  ) {
    addIcons({save, trash, arrowBackOutline, closeCircleOutline});
  }

  async ngOnInit() {
    await AdMob.hideBanner();

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const data = localStorage.getItem('diary');
    if (data) {
      this.diary = JSON.parse(data) as DiaryEntry[];
      this.diary = this.diary.map(entry => ({
        ...entry,
        date: new Date(entry.date)
      }));
    }

    if (this.id !== this.newArticle) {
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
      this.tags.push({name: this.date.getFullYear().toString(), editable: false});
    }
  }

  ionViewWillEnter() {
  }



  async save() {
    if (this.id == this.newArticle) {
      const newid = this.diary.length > 0
        ? Math.max(...this.diary.map(d => d.id)) + 1
        : 0;
      this.diary.unshift({content: this.txt, tags:this.tags, date: this.date, id: newid});
      this.id = newid;
      this.index = 0;
    } else {
      this.diary[this.index].content = this.txt;
      this.diary[this.index].tags = this.tags;
    }
    localStorage.setItem("diary", JSON.stringify(this.diary))
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
            if (this.id !== this.newArticle) {
              this.diary.splice(this.index, 1);
              localStorage.setItem("diary", JSON.stringify(this.diary));
            }
            this.nav.navigateBack('/home');
          }
        }
      ]
    });
    prompt.present();
  }

  public detectChangeTag(event: CustomEvent) {
    const value = event.detail.value.trim();
    if (value.length > 0 && !this.tags.some(t => t.name === value)) {
      this.tags.push({name: value, editable: true});
    }
    this.inputTag = "";
  }

  removeTag(i: number) {
    this.tags.splice(i, 1);
  }
}
