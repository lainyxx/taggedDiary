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
  IonButton,
  AlertController,
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { NavController } from '@ionic/angular';
import { DatabaseService } from '../../services/database.service';
import { ToastService } from '../../services/toast.service';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FilePicker } from '@capawesome/capacitor-file-picker';

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
    IonButton,
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  lockEnabled = false;
  private cancelListener!: () => void;

  constructor(
    private nav: NavController,
    private dbService: DatabaseService,
    private toast: ToastService,
    private alertController: AlertController,
  ) { }

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

  // =====================================
  // 🔑 画面ロック機能
  // =====================================
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

  // =====================================
  // 💾 書き出し（ファイル保存ダイアログを使用）
  // =====================================
  async exportData() {
    try {
      await this.dbService.waitForReady();
      const json = await this.dbService.exportAll();

      const fileName = `tagged-diary-backup-${new Date().toISOString().slice(0, 10)}.json`;

      // 一時ファイルとして保存（アプリ専用領域）
      await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const uri = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      console.log('[exportData] ファイルURI:', uri.uri);

      // 📤 シェアダイアログを開いて、ユーザーに保存先を選ばせる
      await Share.share({
        title: 'タグ付き日記バックアップ',
        text: 'バックアップファイルを保存してください',
        url: uri.uri,
        dialogTitle: 'バックアップファイルを保存',
      });

      this.toast.show('バックアップを作成しました');
    } catch (err) {
      console.error('[exportData] エラー:', err);
      this.toast.show('エクスポートに失敗しました');
    }
  }

  // =====================================
  // 📥 読み込み（ファイル選択ダイアログを使用）
  // =====================================
  async importData() {
    try {
      const pickResult = await FilePicker.pickFiles({
        types: ['application/json'],
      });

      if (!pickResult.files.length) {
        this.toast.show('ファイルが選択されませんでした');
        return;
      }

      const file = pickResult.files[0];
      console.log('📁 Import target:', file.name, file.path);

      const alert = await this.alertController.create({
        header: '確認',
        message: '既存データをすべて上書きしますか？',
        buttons: [
          { text: 'キャンセル', role: 'cancel' },
          {
            text: '上書き',
            handler: () => this.handleImport(file, true)
          },
          {
            text: '追加',
            handler: () => this.handleImport(file, false)
          },
        ],
      });
      await alert.present();
    } catch (err) {
      console.error('❌ Import picker error:', err);
      this.toast.show('ファイル選択に失敗しました');
    }
  }

  private async handleImport(file: any, overwrite: boolean) {

    try {
      if (!file.path) {
        throw new Error('ファイルパスが取得できません');
      }

      // Filesystem で読み込む
      const readResult = await Filesystem.readFile({
        path: file.path,
        encoding: Encoding.UTF8,
      });

      let text: string;
      // 文字列かBlobか判定
      if (readResult.data instanceof Blob) {
        console.log('📌 dataはBlobです');
        // Blob を文字列に変換
        text = await readResult.data.text();
      } else if (typeof readResult.data === 'string') {
        console.log('📌 dataは文字列です');
        text = readResult.data;
      } else {
        throw new Error('不明なデータ形式です');
      }

      await this.dbService.waitForReady();
      await this.dbService.importFromJson(text, overwrite);

      console.log('✅ Import success');
      this.toast.show('データをインポートしました');
      this.nav.navigateRoot('/tabs/home');
    } catch (err) {
      console.error('❌ Import error:', err);
      this.toast.show('インポートに失敗しました');
    }
  }
}
