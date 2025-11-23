import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HebergementNewComponent } from './hebergement-new.component';

describe('HebergementNewComponent', () => {
  let component: HebergementNewComponent;
  let fixture: ComponentFixture<HebergementNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HebergementNewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HebergementNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
