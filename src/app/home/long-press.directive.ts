import { Directive, ElementRef, Input, Output, EventEmitter, AfterViewInit, NgZone } from '@angular/core';
import { GestureController } from '@ionic/angular';


// AIが生成した謎のファイル　ちゃんと動く　後で理解する 


@Directive({
  selector: '[long-press]'
})
export class LongPressDirective implements AfterViewInit {
  @Input() delay = 500;
  @Output() press = new EventEmitter<void>();

  private action: any;
  private longPressActive = false;
  private positions = { start: { x: 0, y: 0 }, current: { x: 0, y: 0 } };

  constructor(
    private el: ElementRef,
    private gestureCtrl: GestureController,
    private zone: NgZone
  ) {}

  ngAfterViewInit() {
    const gesture = this.gestureCtrl.create({
      el: this.el.nativeElement,
      threshold: 0,
      gestureName: 'long-press',
      onStart: ev => {
        this.longPressActive = true;
        this.positions = {
          start: { x: ev.startX, y: ev.startY },
          current: { x: ev.currentX, y: ev.currentY }
        };
        this.startPressTimeout();
      },
      onMove: ev => {
        this.positions.current = { x: ev.currentX, y: ev.currentY };
      },
      onEnd: () => {
        this.longPressActive = false;
        this.clearPressTimeout();
      }
    });
    gesture.enable(true);
  }

  private startPressTimeout() {
    this.clearPressTimeout();
    this.action = setTimeout(() => {
      this.zone.run(() => {
        const dx = Math.abs(this.positions.start.x - this.positions.current.x);
        const dy = Math.abs(this.positions.start.y - this.positions.current.y);
        if (dx <= 15 && dy <= 15 && this.longPressActive) {
          this.longPressActive = false;
          this.press.emit();
        }
      });
    }, this.delay);
  }

  private clearPressTimeout() {
    if (this.action) {
      clearTimeout(this.action);
      this.action = undefined;
    }
  }
}
