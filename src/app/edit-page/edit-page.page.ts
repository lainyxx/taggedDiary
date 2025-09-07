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

// --- DiaryEntry インターフェース ---
interface DiaryEntry {
  id: number;
  content: string;
  tags: string[];
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
  @ViewChild('txtArea', { static: false }) textarea!: IonTextarea;
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  diary: DiaryEntry[] = [];
  txt: string = "";
  id: number;           //編集する日記のid -1は新規作成
  index: number = -1;        //編集する日記の配列上の添字
  tags: string [] = [];
  inputTag: string;
  date: Date;            //最初に編集を開始した日時

  constructor(
    private route: ActivatedRoute,
    public alertController: AlertController,
    private nav: NavController,
    public toastController: ToastController,
  ) {
    addIcons({save, trash, arrowBackOutline, closeCircleOutline});
  }

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const data = localStorage.getItem('diary');
    if (data) {
      this.diary = JSON.parse(data) as DiaryEntry[];
      this.diary = this.diary.map(entry => ({
        ...entry,
        date: new Date(entry.date)
      }));
    }

    if (this.id !== -1) {
      for (let i: number = 0; i < this.diary.length; i++) {
        if (this.diary[i].id === this.id) this.index = i;
      }
      this.txt = this.diary[this.index].content;
      this.tags = this.diary[this.index].tags;
      this.date = this.diary[this.index].date;
    } else {
      this.date = new Date();
    }
  }

  ionViewWillEnter() {
  }

  async save() {
    if (this.id == -1) {
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
    localStorage.diary = JSON.stringify(this.diary);
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
            if (this.id !== -1) {
              this.diary.splice(this.index, 1);
              localStorage.diary = JSON.stringify(this.diary);
            }
            this.nav.navigateBack('/home');
          }
        }
      ]
    });
    prompt.present();
  }

  // public detectInputTag(event: CustomEvent) {    //二回連続で発火するなど安定しない
  //   console.log("hi");
  //   if (event.detail.value.length > 1 && event.detail.value.slice(-1).match(/( |　)/)) {   
  //     this.tags.push(event.detail.value.trim());
  //     this.inputTag = "";
  //   }
  // }
  public detectChangeTag(event: CustomEvent) {
    const value = event.detail.value.trim();
    if (value.length > 0 && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    this.inputTag = "";
  }

  removeTag(i: number) {
    this.tags.splice(i, 1);
  }


  adjustContentPadding() {
    setTimeout(() => {
      this.textarea.getInputElement().then(el => {
        const height = el.scrollHeight;
        this.content.getScrollElement().then(scrollEl => {
          scrollEl.style.paddingBottom = height + 'px';
        });
      });
    }, 0);
  }
}
