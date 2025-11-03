import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AdMob } from '@capacitor-community/admob';
import { OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private lastUnlockTime = 0;
  private backgroundTime = 0;
  lastUrl: string = '';
  private readonly LOCK_TIMEOUT: number = 4000; // ← 4秒後に再ロック


  constructor(
    private platform: Platform,
    private nav: NavController,
    private router: Router,
  ) {
    this.initializeAdMob();
  }

  async initializeAdMob() {
    try {
      await AdMob.initialize({
        testingDevices: [], // デバイスを指定可能
        initializeForTesting: true, // 開発中は true
      });
    } catch (e) {
      console.error('AdMob init failed', e);
    }

  }

  async ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // ロック画面以外の最後の閲覧ページを記録
        if (!event.url.includes('/lock')) {
          this.lastUrl = event.url;
        }
      }
    });

    // 🔹 アプリのフォア・バック切り替え監視
    App.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        // フォアグラウンドに復帰したとき
        const elapsed = Date.now() - this.backgroundTime;
        if (elapsed > this.LOCK_TIMEOUT) {
          await this.checkLock(true);
        }
      } else {
        // バックグラウンドになった時刻を記録
        this.backgroundTime = Date.now();
      }
    });

    await this.platform.ready();
    await this.checkLock();
  }

  private async checkLock(isResume = false) {
    const { value: lockEnabled } = await Preferences.get({ key: 'lockEnabled' });
    const { value: passcode } = await Preferences.get({ key: 'passcode' });

    if (lockEnabled === 'true' && passcode) {
      // 起動時または一定時間経過後にロック画面へ
      if (!isResume || Date.now() - this.lastUnlockTime > this.LOCK_TIMEOUT) {
        // 二重ロック防止
        if (!this.router.url.includes('/lock')) {
          this.nav.navigateForward('/lock');
        }
      }
    }
  }

  // ✅ ロック解除時に呼ばれる
  setUnlockTime() {
    this.lastUnlockTime = Date.now();
  }

}
