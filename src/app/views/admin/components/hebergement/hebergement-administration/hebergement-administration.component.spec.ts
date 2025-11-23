import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HebergementAdministrationComponent } from './hebergement-administration.component';

describe('HebergementAdministrationComponent', () => {
  let component: HebergementAdministrationComponent;
  let fixture: ComponentFixture<HebergementAdministrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HebergementAdministrationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HebergementAdministrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
