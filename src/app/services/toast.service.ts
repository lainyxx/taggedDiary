import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) { }

  async show(message: string, color: 'success' | 'dark' | 'light' = 'light') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}

