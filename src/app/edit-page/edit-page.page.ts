import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  RouterLink, ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonItem, IonInput, 
         IonButton, IonIcon, AlertController, NavController, IonTextarea, IonChip, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, trash, arrowBackOutline, closeCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-edit-page',
  templateUrl: './edit-page.page.html',
  styleUrls: ['./edit-page.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, 
            IonMenuButton, IonItem, IonInput, IonButton, IonIcon, RouterLink,  IonTextarea, IonChip, IonLabel]
})
export class EditPagePage implements OnInit {

  diary: { [key:string]: any }[] = [
  ];
  txt: string = "";
  id: number;    //編集する日記のid -1は新規作成
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
        this.txt = this.diary[this.id].article;
        this.tags = this.diary[this.id].tags;
      }
    }
  }

  save() {
    if (this.id == -1) {
      const now = new Date();
      console.log(now)
      this.diary.unshift({article: this.txt, tags:this.tags, date: now});
      this.id = 0;
    } else {
      this.diary[this.id].article = this.txt;
      this.diary[this.id].tags = this.tags;
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
              this.diary.splice(this.id, 1);
              localStorage.diary = JSON.stringify(this.diary);
              this.nav.pop();       // this.nav.pop()をif文の外に書くとid:0のときなぜか動かない
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
    console.log("bye");
    if (event.detail.value.length > 0) {
      this.tags.push(event.detail.value.trim());
      this.inputTag = "";
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }
}
