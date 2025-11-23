import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HebergementJustificatifPaiementComponent } from './hebergement-justificatif-paiement.component';

describe('HebergementJustificatifPaiementComponent', () => {
  let component: HebergementJustificatifPaiementComponent;
  let fixture: ComponentFixture<HebergementJustificatifPaiementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HebergementJustificatifPaiementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HebergementJustificatifPaiementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
