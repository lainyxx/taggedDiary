import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LockPage } from './lock.page';

describe('LockPage', () => {
  let component: LockPage;
  let fixture: ComponentFixture<LockPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LockPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
