import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevisAdmissionComponent } from './devis-admission.component';

describe('AdmissionComponent', () => {
  let component: DevisAdmissionComponent;
  let fixture: ComponentFixture<DevisAdmissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevisAdmissionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DevisAdmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
