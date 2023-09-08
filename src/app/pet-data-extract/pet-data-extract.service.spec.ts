import { TestBed } from '@angular/core/testing';

import { PetDataExtractService } from './pet-data-extract.service';

describe('PetDataExtractService', () => {
  let service: PetDataExtractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetDataExtractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
