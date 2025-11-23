import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAdmissionDocumentComponent } from './edit-admission-document.component';

describe('EditAdmissionDocumentComponent', () => {
  let component: EditAdmissionDocumentComponent;
  let fixture: ComponentFixture<EditAdmissionDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAdmissionDocumentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditAdmissionDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
