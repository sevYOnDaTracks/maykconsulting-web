import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceEditDemandeComponent } from './finance-edit-demande.component';

describe('FinanceEditDemandeComponent', () => {
  let component: FinanceEditDemandeComponent;
  let fixture: ComponentFixture<FinanceEditDemandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceEditDemandeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinanceEditDemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
