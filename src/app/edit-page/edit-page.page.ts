import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  RouterLink, ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonItem, IonInput, 
         IonButton, IonIcon, AlertController, NavController, IonTextarea } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, trash, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-edit-page',
  templateUrl: './edit-page.page.html',
  styleUrls: ['./edit-page.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, 
            IonMenuButton, IonItem, IonInput, IonButton, IonIcon, RouterLink,  IonTextarea]
})
export class EditPagePage implements OnInit {

  diary: { article: string }[] = [
  ];
  txt: string = "";
  id: number;    //編集する日記のid -1は新規作成

  constructor(
    private route: ActivatedRoute,
    public alertController: AlertController,
    private nav: NavController,
  ) {
    addIcons({save, trash, arrowBackOutline});
  }

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
  }

  ionViewWillEnter() {
    if ('diary' in localStorage) {
      this.diary = JSON.parse(localStorage.diary);
      if (this.id !== -1) {
        this.txt = this.diary[this.id].article;
      }
    }
    
  }

  save() {
    if (this.id == -1) {
      this.diary.unshift({article: this.txt});
      this.id = 0;
    } else {
      this.diary[this.id].article = this.txt;
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

}
