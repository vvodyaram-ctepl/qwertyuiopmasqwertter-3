import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PetDataExtractListComponent } from './pet-data-extract-list.component';

describe('PetDataExtractListComponent', () => {
  let component: PetDataExtractListComponent;
  let fixture: ComponentFixture<PetDataExtractListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PetDataExtractListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PetDataExtractListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
