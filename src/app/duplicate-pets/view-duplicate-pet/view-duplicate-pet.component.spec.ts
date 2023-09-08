import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDuplicatePetComponent } from './view-duplicate-pet.component';

describe('ViewDuplicatePetComponent', () => {
  let component: ViewDuplicatePetComponent;
  let fixture: ComponentFixture<ViewDuplicatePetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewDuplicatePetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewDuplicatePetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
