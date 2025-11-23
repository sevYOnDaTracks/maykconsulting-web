import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceNewComponent } from './finance-new.component';

describe('FinanceNewComponent', () => {
  let component: FinanceNewComponent;
  let fixture: ComponentFixture<FinanceNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceNewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinanceNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
