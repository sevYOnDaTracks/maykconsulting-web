import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HebergementSendMessageComponent } from './hebergement-send-message.component';

describe('HebergementSendMessageComponent', () => {
  let component: HebergementSendMessageComponent;
  let fixture: ComponentFixture<HebergementSendMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HebergementSendMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HebergementSendMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
