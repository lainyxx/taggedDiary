import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import { AdMob } from '@capacitor-community/admob';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize  } from '@capacitor/keyboard';
import 'quill/dist/quill.snow.css';
import '../app/quill-modules/preserve-whitespace-module';  // <- 一度だけ import することで読み込まない問題が解決

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
    // await this.platform.ready();

    // // キーボード表示時に手動リサイズ
    // window.addEventListener('keyboardWillShow', (e) => {
    //   const app = document.querySelector('ion-app');
    //   if (app) {
    //     app.style.marginBottom = (e as any).keyboardHeight + 4 + 'px';
    //   }
    // });

    // window.addEventListener('keyboardWillHide', () => {
    //   const app = document.querySelector('ion-app');
    //   if (app) {
    //     app.style.marginBottom = '0px';
    //   }
    // });
  }

}
