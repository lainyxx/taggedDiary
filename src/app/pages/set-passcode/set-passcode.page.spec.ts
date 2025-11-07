import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetPasscodePage } from './set-passcode.page';

describe('SetPasscodePage', () => {
  let component: SetPasscodePage;
  let fixture: ComponentFixture<SetPasscodePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SetPasscodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
