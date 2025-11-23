import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingV10Component } from './landing-v10.component';

describe('LandingV10Component', () => {
  let component: LandingV10Component;
  let fixture: ComponentFixture<LandingV10Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LandingV10Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingV10Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
