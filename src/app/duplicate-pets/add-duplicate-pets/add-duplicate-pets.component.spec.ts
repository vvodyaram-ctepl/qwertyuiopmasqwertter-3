import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDuplicatePetsComponent } from './add-duplicate-pets.component';

describe('AddDuplicatePetsComponent', () => {
  let component: AddDuplicatePetsComponent;
  let fixture: ComponentFixture<AddDuplicatePetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDuplicatePetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDuplicatePetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
