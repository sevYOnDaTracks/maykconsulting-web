import { TestBed } from '@angular/core/testing';

import { EmailAdmissionService } from './email-admission.service';

describe('EmailAdmissionService', () => {
  let service: EmailAdmissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailAdmissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
