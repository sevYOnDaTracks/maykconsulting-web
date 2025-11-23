import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HebergementEditDemandeComponent } from './hebergement-edit-demande.component';

describe('HebergementEditDemandeComponent', () => {
  let component: HebergementEditDemandeComponent;
  let fixture: ComponentFixture<HebergementEditDemandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HebergementEditDemandeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HebergementEditDemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
