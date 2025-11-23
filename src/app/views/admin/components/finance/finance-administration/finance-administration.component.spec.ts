import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceAdministrationComponent } from './finance-administration.component';

describe('FinanceAdministrationComponent', () => {
  let component: FinanceAdministrationComponent;
  let fixture: ComponentFixture<FinanceAdministrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceAdministrationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinanceAdministrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
