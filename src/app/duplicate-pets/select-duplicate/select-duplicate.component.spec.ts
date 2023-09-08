import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectDuplicateComponent } from './select-duplicate.component';

describe('SelectDuplicateComponent', () => {
  let component: SelectDuplicateComponent;
  let fixture: ComponentFixture<SelectDuplicateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectDuplicateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectDuplicateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
