import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionEditDemandeComponent } from './admission-edit-demande.component';

describe('AdmissionEditDemandeComponent', () => {
  let component: AdmissionEditDemandeComponent;
  let fixture: ComponentFixture<AdmissionEditDemandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmissionEditDemandeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdmissionEditDemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
