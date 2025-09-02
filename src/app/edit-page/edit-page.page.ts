import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonItem, IonInput, IonButton, IonIcon, AlertController, NavController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, trash } from 'ionicons/icons';

@Component({
  selector: 'app-edit-page',
  templateUrl: './edit-page.page.html',
  styleUrls: ['./edit-page.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonItem, IonInput,IonButton, IonIcon]
})
export class EditPagePage implements OnInit {

  diary: { article: string }[] = [
  ];
  sentence: string;
  
  id = Number(this.route.snapshot.paramMap.get('id'));

  constructor(
    private route: ActivatedRoute,
    public alertController: AlertController,
    private nav: NavController,
  ) {
    addIcons({save, trash});
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    if ('diary' in localStorage) {
      this.diary = JSON.parse(localStorage.diary);
      this.sentence = this.diary[this.id].article;
    }
  }

  save() {
    this.diary[this.id].article = this.sentence;
    this.sentence = '';
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
            this.diary.splice(this.id, 1);
            localStorage.diary = JSON.stringify(this.diary);
            this.nav.pop();
          }
        }
      ]
    });
    prompt.present();
  }

}
