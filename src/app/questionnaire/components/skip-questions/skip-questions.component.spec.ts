import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SkipQuestionsComponent } from './skip-questions.component';

describe('SkipQuestionsComponent', () => {
  let component: SkipQuestionsComponent;
  let fixture: ComponentFixture<SkipQuestionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SkipQuestionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkipQuestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
