import { Component, OnInit, OnDestroy } from '@angular/core';
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
  Platform,
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { NavController } from '@ionic/angular';
import { AppComponent } from '../../app.component';
import { AdMob } from '@capacitor-community/admob';

@Component({
  selector: 'app-lock',
  standalone: true,
  templateUrl: './lock.page.html',
  styleUrls: ['./lock.page.scss'],
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
  ],
})
export class LockPage implements OnInit, OnDestroy {
  enteredPasscode = '';
  storedPasscode = '';
  message = '';
  private backHandler: any;

  constructor(
    private nav: NavController,
    private app: AppComponent,
    private platform: Platform
  ) { }

  async ngOnInit() {
    await AdMob.hideBanner();

    const { value } = await Preferences.get({ key: 'passcode' });
    this.storedPasscode = value || '';

    // 🔹 Androidハードウェア戻るボタン無効化
    this.backHandler = this.platform.backButton.subscribeWithPriority(9999, () => {
      // 何もしない（戻らせない）
    });

    // 🔹 iOSのジェスチャーバック防止（必要に応じて）
    history.pushState(null, '');
    window.addEventListener('popstate', this.preventBack);
  }

  ngOnDestroy() {
    // ハンドラ解除
    this.backHandler.unsubscribe();
    window.removeEventListener('popstate', this.preventBack);
  }

  preventBack = () => {
    history.pushState(null, '');
  };

  async unlock() {
    if (this.enteredPasscode === this.storedPasscode) {
      // ✅ ロック解除時刻を記録
      this.app.setUnlockTime();

      // ✅ 元のページに戻る
      if (this.app.lastUrl) {
        this.nav.navigateBack(this.app.lastUrl);
      } else {
        this.nav.navigateRoot('/tabs/home');
      }
    } else {
      this.message = 'パスコードが違います';
    }
  }
}
