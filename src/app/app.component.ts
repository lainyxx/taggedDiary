import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NavController, Platform } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { AdMob } from '@capacitor-community/admob';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';

import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private lastUnlockTime = 0;
  private backgroundTime = 0;
  private readonly LOCK_TIMEOUT = 4000; // 4秒
  lastUrl = '';

  constructor(
    private platform: Platform,
    private nav: NavController,
    private router: Router,
    private dbService: DatabaseService,
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    // ルーターイベント監視
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && !event.url.includes('/lock')) {
        this.lastUrl = event.url;
      }
    });
  }

  /**
   * ✅ アプリ起動時の初期化
   */
  private async initializeApp() {
    await this.platform.ready();

    await this.initializeAdMob();

    // ロック初期チェック
    await this.checkLock();

    // アプリ状態変更監視
    App.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        const elapsed = Date.now() - this.backgroundTime;
        if (elapsed > this.LOCK_TIMEOUT) {
          await this.checkLock(true);
        }
        // ✅ DBが閉じていたら再接続
        const isDbOpen = await this.dbService.isDbOpen();
        if (!isDbOpen) {
          console.log('[App] Reconnecting to database...');
          await this.dbService.initDB();
        }
      } else {
        // バックグラウンドになった時刻記録＋DBを安全に閉じる
        this.backgroundTime = Date.now();
        try {
          await this.dbService.close();
          console.log('[App] Database connection closed.');
        } catch (err) {
          console.warn('[App] DB close failed:', err);
        }
      }
    });
  }

  private async initializeAdMob() {
    try {
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: true, // TASK: 本番はfalse
      });
      console.log('[App] AdMob initialized');
    } catch (e) {
      console.error('[App] AdMob init failed', e);
    }
  }

  private async checkLock(isResume = false) {
    const [lockEnabledRes, passcodeRes] = await Promise.all([
      Preferences.get({ key: 'lockEnabled' }),
      Preferences.get({ key: 'passcode' }),
    ]);

    const lockEnabled = lockEnabledRes.value === 'true';
    const passcode = passcodeRes.value;

    if (lockEnabled && passcode) {
      if (!isResume || Date.now() - this.lastUnlockTime > this.LOCK_TIMEOUT) {
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
