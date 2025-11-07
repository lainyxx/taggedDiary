
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
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar.page').then(m => m.CalendarPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage),
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
    loadComponent: () => import('./pages/edit-page/edit-page.page').then(m => m.EditPagePage)
  },
  {
    path: 'set-passcode',
    loadComponent: () => import('./pages/set-passcode/set-passcode.page').then(m => m.SetPasscodePage)
  },
  {
    path: 'lock',
    loadComponent: () => import('./pages/lock/lock.page').then(m => m.LockPage)
  },
];
