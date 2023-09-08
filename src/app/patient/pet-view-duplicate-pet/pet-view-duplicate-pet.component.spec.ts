import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PetViewDuplicatePetComponent } from './pet-view-duplicate-pet.component';

describe('PetViewDuplicatePetComponent', () => {
  let component: PetViewDuplicatePetComponent;
  let fixture: ComponentFixture<PetViewDuplicatePetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PetViewDuplicatePetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PetViewDuplicatePetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
