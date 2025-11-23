import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionUserDetailComponent } from './admission-user-detail.component';

describe('AdmissionUserDetailComponent', () => {
  let component: AdmissionUserDetailComponent;
  let fixture: ComponentFixture<AdmissionUserDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmissionUserDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdmissionUserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
