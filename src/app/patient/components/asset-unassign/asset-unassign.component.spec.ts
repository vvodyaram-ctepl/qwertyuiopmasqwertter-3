import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetUnassignComponent } from './asset-unassign.component';

describe('AssetUnassignComponent', () => {
  let component: AssetUnassignComponent;
  let fixture: ComponentFixture<AssetUnassignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssetUnassignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetUnassignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
