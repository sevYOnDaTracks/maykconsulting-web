import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPaiementJustificatifComponent } from './edit-paiement-justificatif.component';

describe('EditPaiementJustificatifComponent', () => {
  let component: EditPaiementJustificatifComponent;
  let fixture: ComponentFixture<EditPaiementJustificatifComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPaiementJustificatifComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditPaiementJustificatifComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
