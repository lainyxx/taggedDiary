import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

import { bookOutline, calendarOutline, settingsOutline } from 'ionicons/icons';

import { addIcons } from 'ionicons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './tabs.page.html',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterModule],
})
export class TabsPage {
  constructor() {
    addIcons({
      bookOutline,
      calendarOutline,
      settingsOutline,
    });
  }
}
