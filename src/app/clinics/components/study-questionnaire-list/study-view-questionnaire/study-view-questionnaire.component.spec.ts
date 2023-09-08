import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyViewQuestionnaireComponent } from './study-view-questionnaire.component';

describe('StudyViewQuestionnaireComponent', () => {
  let component: StudyViewQuestionnaireComponent;
  let fixture: ComponentFixture<StudyViewQuestionnaireComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudyViewQuestionnaireComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyViewQuestionnaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
