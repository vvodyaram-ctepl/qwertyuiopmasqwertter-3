import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyQuestionnaireListComponent } from './study-questionnaire-list.component';

describe('StudyQuestionnaireListComponent', () => {
  let component: StudyQuestionnaireListComponent;
  let fixture: ComponentFixture<StudyQuestionnaireListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudyQuestionnaireListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyQuestionnaireListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
