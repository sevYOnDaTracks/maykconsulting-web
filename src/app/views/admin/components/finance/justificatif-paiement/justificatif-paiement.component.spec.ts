import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JustificatifPaiementComponent } from './justificatif-paiement.component';

describe('JustificatifPaiementComponent', () => {
  let component: JustificatifPaiementComponent;
  let fixture: ComponentFixture<JustificatifPaiementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JustificatifPaiementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JustificatifPaiementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
