import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-set-passcode',
  standalone: true,
  templateUrl: './set-passcode.page.html',
  styleUrls: ['./set-passcode.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonBackButton,
  ],
})
export class SetPasscodePage implements OnInit {
  passcode = '';
  confirmCode = '';
  message = '';
  saved = false; // ← 保存したかどうかのフラグ

  constructor(private nav: NavController) { }

  ngOnInit() {
    this.passcode = '';
    this.confirmCode = '';
    this.message = '';
    this.saved = false;
  }

  async savePasscode() {
    if (!this.passcode || !this.confirmCode) {
      this.message = 'パスコードを入力してください。';
      return;
    }

    const onlyNumbers = /^\d+$/;
    if (!onlyNumbers.test(this.passcode) || !onlyNumbers.test(this.confirmCode)) {
      this.message = '数字のみ入力できます。';
      return;
    }

    if (this.passcode.length !== 4) {
      this.message = '4桁のパスコードを入力してください。';
      return;
    }

    if (this.passcode !== this.confirmCode) {
      this.message = '確認用パスコードが一致しません。';
      return;
    }

    await Preferences.set({
      key: 'passcode',
      value: this.passcode,
    });

    this.saved = true; // ✅ 保存成功フラグ
    this.nav.back();
  }

  async ionViewWillLeave() {
    // ✅ ページ離脱時、パスコード未保存ならトグルOFF用イベントを発火
    if (!this.saved) {
      const event = new CustomEvent('passcode-cancelled', { bubbles: true });
      window.dispatchEvent(event);
    }
  }
}
