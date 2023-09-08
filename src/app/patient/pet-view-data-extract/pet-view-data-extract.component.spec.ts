import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PetViewDataExtractComponent } from './pet-view-data-extract.component';

describe('PetViewDataExtractComponent', () => {
  let component: PetViewDataExtractComponent;
  let fixture: ComponentFixture<PetViewDataExtractComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PetViewDataExtractComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PetViewDataExtractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
