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
  IonToggle,
  IonList,
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonToggle,
    IonList,
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  lockEnabled = false;
  private cancelListener!: () => void;

  constructor(private nav: NavController) { }

  async ngOnInit() {
    const { value } = await Preferences.get({ key: 'lockEnabled' });
    this.lockEnabled = value === 'true';

    // ✅ 「キャンセル」イベントを監視
    this.cancelListener = () => {
      this.lockEnabled = false;
      Preferences.set({ key: 'lockEnabled', value: 'false' });
    };
    window.addEventListener('passcode-cancelled', this.cancelListener);
  }

  ngOnDestroy() {
    // ✅ メモリリーク防止
    window.removeEventListener('passcode-cancelled', this.cancelListener);
  }

  async onToggleLock(event: CustomEvent) {
    const enabled = event.detail.checked;
    this.lockEnabled = enabled;

    await Preferences.set({
      key: 'lockEnabled',
      value: String(enabled),
    });

    if (enabled) {
      this.nav.navigateForward('/set-passcode');
    } else {
      await Preferences.remove({ key: 'passcode' });
    }
  }
}
