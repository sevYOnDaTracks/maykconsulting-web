import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionAdministrationComponent } from './admission-administration.component';

describe('AdmissionAdministrationComponent', () => {
  let component: AdmissionAdministrationComponent;
  let fixture: ComponentFixture<AdmissionAdministrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmissionAdministrationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdmissionAdministrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
