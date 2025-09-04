import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  RouterLink, ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonItem, IonInput, 
         IonButton, IonIcon, AlertController, NavController, IonTextarea, IonChip, IonLabel } from '@ionic/angular/standalone';
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
            IonMenuButton, IonItem, IonInput, IonButton, IonIcon, RouterLink,  IonTextarea, IonChip, IonLabel]
})
export class EditPagePage implements OnInit {

  diary: DiaryEntry[] = [
  ];
  txt: string = "";
  id: number;           //編集する日記のid -1は新規作成
  index: number = -1;        //編集する日記の配列上の添字
  tags: string [] = [];
  inputTag: string;

  constructor(
    private route: ActivatedRoute,
    public alertController: AlertController,
    private nav: NavController,
  ) {
    addIcons({save, trash, arrowBackOutline, closeCircleOutline});
  }

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
  }

  ionViewWillEnter() {
    if ('diary' in localStorage) {
      this.diary = JSON.parse(localStorage.diary);
      if (this.id !== -1) {
        for (let i: number = 0; i < this.diary.length; i++) {
          if (this.diary[i].id === this.id) this.index = i;
        }
        this.txt = this.diary[this.index].content;
        this.tags = this.diary[this.index].tags;
      }
    }
  }

  save() {
    if (this.id == -1) {
      const now = new Date();
      console.log(now);
      let newid;
      if (this.diary.length === 0) newid = 0;
      else newid = this.diary[0].id + 1;
      this.diary.unshift({content: this.txt, tags:this.tags, date: now, id: newid});
      this.id = newid;
      this.index = 0;
    } else {
      this.diary[this.index].content = this.txt;
      this.diary[this.index].tags = this.tags;
    }
    localStorage.diary = JSON.stringify(this.diary);
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
          handler: data => {
            if (this.id !== -1) {
              this.diary.splice(this.index, 1);
              localStorage.diary = JSON.stringify(this.diary);
              this.nav.pop();       // this.nav.pop()をif文の外に書くとindex:0のときなぜか動かない
            } else {
              this.nav.pop();
            }
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
    if (event.detail.value.length > 0) {
      this.tags.push(event.detail.value.trim());
      this.inputTag = "";
    }
  }

  removeTag(i: number) {
    this.tags.splice(i, 1);
  }
}
