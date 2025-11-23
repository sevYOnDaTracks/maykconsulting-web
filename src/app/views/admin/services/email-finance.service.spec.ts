import { TestBed } from '@angular/core/testing';

import { EmailFinanceService } from './email-finance.service';

describe('EmailFinanceService', () => {
  let service: EmailFinanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailFinanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
