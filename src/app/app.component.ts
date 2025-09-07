import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import { AdMob } from '@capacitor-community/admob';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize  } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform
  ) {
    this.initializeAdMob();
  }

  async initializeAdMob() {
    await AdMob.initialize({
      testingDevices: [], // デバイスを指定可能
      initializeForTesting: true, // 開発中は true
    });
  }

  async ngOnInit() {
    await this.platform.ready();

    if (Capacitor.isNativePlatform()) {
      Keyboard.setResizeMode({ mode: KeyboardResize.None });
      console.log('Keyboard resize mode set to none');
    }
  }

}
