import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, NavController, IonFab,
         IonFabButton, IonIcon, IonMenu, IonListHeader, IonButtons, IonMenuButton, IonMenuToggle, IonChip,
        AlertController, IonButton, MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { LongPressDirective } from './long-press.directive';

// --- DiaryEntry インターフェース ---
interface DiaryEntry {
  id: number;
  content: string;
  tags: string[];
  date: Date;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, RouterLink, RouterLinkActive,
            IonFab, IonFabButton, IonIcon, IonMenu, IonListHeader, IonButtons, IonMenuButton, IonMenuToggle,
            IonChip, IonButton, LongPressDirective],
})
export class HomePage implements OnInit {
  allDiary: DiaryEntry[] = [];
  diary: DiaryEntry[] = [];  // 表示用
  selectedTags: string[] = [];
  uniqueTags = new Set<string>([]);
  tagStyles: { [key: string]: any }[] = [];

  constructor(
    public nav: NavController,
    private route: ActivatedRoute,
    public alertController: AlertController,
    private menuController: MenuController,
  ) {
    addIcons({ add });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    if ('diary' in localStorage) {
      this.allDiary = JSON.parse(localStorage.diary) as DiaryEntry[];
      this.diary = [...this.allDiary];
      this.getUniqueTags(this.allDiary);
    }
  }

  addArticle() {
    this.nav.navigateForward('/edit-page/-1');  // id:-1 は新規作成
  }

  getUniqueTags(entries: DiaryEntry[]) {
    this.uniqueTags.clear();
    this.tagStyles = [];

    for (const entry of entries) {
      for (const tag of entry.tags) {
        this.uniqueTags.add(tag);
      }
    }

    for (let i = 0; i < this.uniqueTags.size; i++) {
      this.tagStyles.push({
        color: 'primary',
        outline: true,
      });
    }
  }

  get uniqueTagsArray(): string[] {
    return Array.from(this.uniqueTags);
  }

  toggleTag(index: number) {
    this.tagStyles[index].outline = !this.tagStyles[index].outline;
    const t = this.uniqueTagsArray[index];

    if (!this.tagStyles[index].outline) {
      if (!this.selectedTags.includes(t)) {
        this.selectedTags.push(t);
      }
    } else {
      this.selectedTags = this.selectedTags.filter(tag => tag !== t);
    }

    this.diary = this.searchEntries(this.selectedTags);
  }

  searchEntries(selectedTags: string[]): DiaryEntry[] {
    if (selectedTags.length === 0) return [...this.allDiary];

    return this.allDiary.filter(entry =>
      selectedTags.every(tag => entry.tags.includes(tag))
    );
  }

  async deleteTag(index: number) {
    await this.menuController.close();
    const t: string = this.uniqueTagsArray[index];
    const prompt = await this.alertController.create({
      header:  'タグ"' + t + '"を削除しますか？',
      buttons: [
        {
          text: '閉じる'
        },
        {
          text: '削除',
          handler: data => {
            for (let i:number = 0; i < this.allDiary.length; i++) {
              this.allDiary[i].tags = this.allDiary[i].tags.filter(tag => tag !== t);
            }
            for (let i:number = 0; i < this.tagStyles.length; i++) {
              this.tagStyles[i].outline = true;
            }
            this.selectedTags = [];
            this.uniqueTags.delete(t);
            this.diary = [...this.allDiary];
            localStorage.diary = JSON.stringify(this.allDiary);
          }
        }
      ]
    });
    prompt.present();
  }
}
