import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, NavController, IonFab, IonFabButton, IonIcon, } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, RouterLink, RouterLinkActive, IonFab, IonFabButton, IonIcon, ],
})
export class HomePage implements OnInit {
  diary: { article: string }[] = [
  ];

  constructor(public nav: NavController) {
    addIcons({ add });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    if ('diary' in localStorage) {
      this.diary = JSON.parse(localStorage.diary);
    } 
  }

  addArticle() {
    // this.diary.unshift({article: ''});
    // localStorage.diary = JSON.stringify(this.diary);
    this.nav.navigateForward('edit-page/-1');  // id:-1は新規作成を表す
  }

}
