import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PetDataExtractComponent } from './pet-data-extract.component';

describe('PetDataExtractComponent', () => {
  let component: PetDataExtractComponent;
  let fixture: ComponentFixture<PetDataExtractComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PetDataExtractComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PetDataExtractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
