import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PetAssetComponent } from './pet-asset.component';

describe('PetAssetComponent', () => {
  let component: PetAssetComponent;
  let fixture: ComponentFixture<PetAssetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PetAssetComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PetAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
