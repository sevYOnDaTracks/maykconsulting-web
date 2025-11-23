import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroTenComponent } from './intro-ten.component';

describe('IntroTenComponent', () => {
  let component: IntroTenComponent;
  let fixture: ComponentFixture<IntroTenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IntroTenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntroTenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
