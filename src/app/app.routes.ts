
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./calendar/calendar.page').then(m => m.CalendarPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage),
      },

      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'edit-page/:id',
    loadComponent: () => import('./edit-page/edit-page.page').then( m => m.EditPagePage)
  },
  {
    path: 'set-passcode',
    loadComponent: () => import('./set-passcode/set-passcode.page').then( m => m.SetPasscodePage)
  },
  {
    path: 'lock',
    loadComponent: () => import('./lock/lock.page').then( m => m.LockPage)
  },
];
