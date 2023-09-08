import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPetDataExtractComponent } from './view-pet-data-extract.component';

describe('ViewPetDataExtractComponent', () => {
  let component: ViewPetDataExtractComponent;
  let fixture: ComponentFixture<ViewPetDataExtractComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewPetDataExtractComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewPetDataExtractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
