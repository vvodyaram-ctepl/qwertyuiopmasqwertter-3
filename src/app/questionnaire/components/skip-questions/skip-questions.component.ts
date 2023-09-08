import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { LookupService } from 'src/app/services/util/lookup.service';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { QuestionnaireService } from '../../questionnaire.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-skip-questions',
  templateUrl: './skip-questions.component.html',
  styleUrls: ['./skip-questions.component.scss', '../../styles/custom-slider.scss']
})
export class SkipQuestionsComponent implements OnInit {
  public data: any = {};
  public questionnaireId: any;
  public menuId: any;
  public isFav: boolean = false;
  modalRef: NgbModalRef;

  @ViewChild('confirmPublish') confirmPublish: ElementRef;

  private finalObject: any = {};

  skipForm: any;

  isPublished: boolean = false; //Just to check if the user is trying to edit published questionnaire with the route known

  queryParams: any = {};

  public othersSpecifyText: string = this.toUpperAndTrim(environment.otherSpecifyText);

  constructor(
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private questionnaireService: QuestionnaireService,
    private fb: FormBuilder,
    private userDataService: UserDataService,
    private lookupService: LookupService,
    private toastr: ToastrService,
    private router: Router,
    private modalService: NgbModal,
    private alertService: AlertService
  ) {
  }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });

    //permission for the module
    let userProfileData = this.userDataService.getRoleDetails();

    userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
      if (ele.menuId == "26") {
        this.menuId = 26;
        if (ele.menuActionId != "3") {
          this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
          return;
        }
      }
    });

    this.skipForm = this.fb.group({
      questionAndOptions: this.fb.array([])
    });

    /* skipForm value example(no sections & 2 questions, one with 2 options and other with 3 options)
    skipForm = {
      questionsAndOptions: [
        //question1
        [
          //option1
          {
            questionId: 1,
            questionOptionId: 1,
            skipTo: ''
          },
          //option2
          {
            questionId: 2,
            questionOptionId: 2,
            skipTo: ''
          },
        ],
        //question2
        [
          //option1
          {
            questionId: 1,
            questionOptionId: 1,
            skipTo: ''
          },
          //option2
          {
            questionId: 2,
            questionOptionId: 2,
            skipTo: ''
          },
          //option3
          {
            questionId: 2,
            questionOptionId: 2,
            skipTo: ''
          }
        ]
      ]
    } */

    /* skipForm value example(2 sections each with - 2 questions, one with 2 options and other with 3 options)
    skipForm = {
      questionsAndOptions: [
        //section1
        [
          //question1
          [
            //option1
            {
              questionId: 1,
              questionOptionId: 1,
              skipTo: ''
            },
            //option2
            {
              questionId: 2,
              questionOptionId: 2,
              skipTo: ''
            },
          ],
          //question2
          [
            //option1
            {
              questionId: 1,
              questionOptionId: 1,
              skipTo: ''
            },
            //option2
            {
              questionId: 2,
              questionOptionId: 2,
              skipTo: ''
            },
            //option3
            {
              questionId: 2,
              questionOptionId: 2,
              skipTo: ''
            }
          ]
        ],
        //section2
        [
          //question1
          [
            //option1
            {
              questionId: 1,
              questionOptionId: 1,
              skipTo: ''
            },
            //option2
            {
              questionId: 2,
              questionOptionId: 2,
              skipTo: ''
            },
          ],
          //question2
          [
            //option1
            {
              questionId: 1,
              questionOptionId: 1,
              skipTo: ''
            },
            //option2
            {
              questionId: 2,
              questionOptionId: 2,
              skipTo: ''
            },
            //option3
            {
              questionId: 2,
              questionOptionId: 2,
              skipTo: ''
            }
          ]
        ]
      ]
    } */

    this.spinner.show();
    this.activatedRoute.params.subscribe(params => {
      this.questionnaireId = params.questionnaireId;
      this.questionnaireService.getQuestionnaireById(`/api/questionnaire/${this.questionnaireId}`).subscribe(res => {
        if (res.status.success === true) {

          this.data = res.response.questionnaire;

          this.isPublished = this.data.isPublished;

          //check and return if published
          if (this.isPublished) {
            this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
            this.spinner.hide();
            return;
          }

          //To show slider scale based on options and get next questions
          this.data.questions.forEach((question: any, i: number) => {
            // To show slider scale based on options
            this.data.questions[i].other.showTicks = !this.data.questions[i].other.isContinuousScale;
            this.data.questions[i].other.vertical = this.data.questions[i].other.isVerticalScale;
            this.data.questions[i].other.disabled = true;
            this.data.questions[i].other.getLegend = (value: number): string => {
              return value != this.data.questions[i].other.ceil ? '' + value : '';
            }

            // To get next questions
            question.nextQuestions = [];
            this.data.questions[i].nextQuestions = this.data.questions.slice(i + 1);

            //group nextQuestions based on sections - if sections exist
            if (this.data.sections.length) {
              let sectionBasedNextQuestions = [];
              this.data.sections.forEach((section: any, j: number) => {
                let thisSectionQuestions = question.nextQuestions.filter((question: any) => question.section.sectionName == section.sectionName);
                sectionBasedNextQuestions = sectionBasedNextQuestions.concat({ [section.sectionName]: thisSectionQuestions });
              });
              this.data.questions[i].nextQuestions = sectionBasedNextQuestions;
            }
            else {
              //To create dynamic form for skip implementation (without sections) -- start

              //Dynamically add questions array to questionAndOptions array
              let questionsArray = this.skipForm.get('questionAndOptions') as FormArray;
              questionsArray.push(this.createArray());

              //Dynamically add skipObj to array inside questionAndOptions array
              question.questionAnswerOptions.forEach((option: any, j: number) => {
                let optionsArray = this.skipForm.get('questionAndOptions')['controls'][i] as FormArray;
                optionsArray.push(this.createSkipObj());
                optionsArray['controls'][j].patchValue({ questionId: question.questionId, questionOptionId: option.questionAnswerId });
              });

              //To create dynamic form for skip implementation (without sections) -- end
            }
          });

          //group questions based on sections
          this.data.sectionWiseQuestions = [];
          this.data.sections.forEach((section: any, sectionIndex: number) => {
            let thisSectionQuestions = this.data.questions.filter((question: any) => question.section.sectionName == section.sectionName);

            this.data.sectionWiseQuestions = this.data.sectionWiseQuestions.concat({ [section.sectionName]: thisSectionQuestions });

            //To create dynamic form for skip implementation (with sections) -- start

            //Dynamically add sections array to questionAndOptions
            let sectionsArray = this.skipForm.get('questionAndOptions') as FormArray;
            sectionsArray.push(this.createArray());
            thisSectionQuestions.forEach((question: any, quesIndex: number) => {
              //Dynamically add questions array to sections array
              let questionsArray = sectionsArray['controls'][sectionIndex] as FormArray;
              questionsArray.push(this.createArray());

              //Dynamically add skipObj to array inside questionAndOptions array
              question.questionAnswerOptions.forEach((option: any, optionIndex: number) => {
                let optionsArray = questionsArray['controls'][quesIndex] as FormArray;
                optionsArray.push(this.createSkipObj());
                optionsArray['controls'][optionIndex].patchValue({ questionId: question.questionId, questionOptionId: option.questionAnswerId });
              });
            });

            //To create dynamic form for skip implementation (with sections) -- end
          });

          this.spinner.hide();
        }
        else {
          this.toastr.error(res.errors[0].message);
          this.spinner.hide();
        }
      },
        err => {
          this.errorMsg(err);
        }
      );
    });

    this.checkFav();
  }

  createSkipObj() {
    return this.fb.group({
      questionId: [],
      questionOptionId: [],
      skipTo: ['']
    });
  }

  //For creating sections array if section based question and for creating questions array 
  createArray() {
    return this.fb.array([]);
  }

  getSkipToControl(optionIndex, questionIndex, sectionIndex?) {
    if (sectionIndex >= 0)
      return this.skipForm.get('questionAndOptions').get(sectionIndex.toString()).get(questionIndex.toString()).get(optionIndex.toString()).get('skipTo') as FormControl;
    return this.skipForm.get('questionAndOptions').get(questionIndex.toString()).get(optionIndex.toString()).get('skipTo') as FormControl;
  }

  checkFav() {
    this.lookupService.getFavInfo(`/api/favourites/isFavourite/${this.menuId}/${this.questionnaireId}`).subscribe(res => {
      if (res.response.favourite.isFavourite)
        this.isFav = true;
    });
  }

  makeFav() {
    this.spinner.show();
    this.lookupService.addasFav(`/api/favourites/${this.menuId}/${this.questionnaireId}`, {}).subscribe(res => {
      if (res.status.success === true) {
        this.isFav = true;
        this.toastr.success('Added to Favorites');
        this.spinner.hide();
      }
      else {
        this.toastr.error(res.errors[0].message);
        this.spinner.hide();
      }
    },
      err => {
        this.errorMsg(err);
      }
    );
  }

  removeFav() {
    this.spinner.show();
    this.lookupService.removeFav(`/api/favourites/${this.menuId}/${this.questionnaireId}`, {}).subscribe(res => {
      if (res.status.success === true) {
        this.isFav = false;
        this.toastr.success('Removed from Favorites');
        this.spinner.hide();
      }
      else {
        this.toastr.error(res.errors[0].message);
        this.spinner.hide();
      }
    },
      err => {
        this.errorMsg(err);
      }
    );
  }

  errorMsg(err) {
    if (err.status == 500) {
      this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
      this.spinner.hide();
    }
    else {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      this.spinner.hide();
    }
  }

  toUpperAndTrim(string: any) {
    return string.toUpperCase().replace(/\s/g, '');
  }

  confirmPublishCheck() {
    this.finalObject = {
      questionnaireId: this.questionnaireId,
      questions: this.flattenArrayOfArrays(this.skipForm.value.questionAndOptions, this.finalObject.questions)
    };
    if (this.finalObject.questions.length == 0) {
      this.toastr.error("Please select 'skip to' option for at least one question");
      return;
    }
    else {
      this.openPopup(this.confirmPublish, 'xs')
    }
  }

  openPopup(div, size) {
    this.spinner.show();
    this.modalRef = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
    setTimeout(() => this.spinner.hide(), 300);
  }

  // Used to get all the selected skipTo options into single array from nested arrays
  flattenArrayOfArrays(a, r) {
    if (!r) { r = [] }
    for (var i = 0; i < a.length; i++) {
      if (a[i].constructor == Array) {
        this.flattenArrayOfArrays(a[i], r);
      } else {
        if (a[i].skipTo)
          r.push(a[i]);
      }
    }
    return r;
  }

  publish() {
    this.spinner.show();
    this.questionnaireService.updateQuestionnaire('/api/questionnaire/updateQuestionnaireForSkip', this.finalObject).subscribe((res: any) => {
      if (res.status.success === true) {
        this.isPublished = true;
        this.toastr.success('Questionnaire updated successfully!');
        this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
        this.spinner.hide();
      }
      else {
        this.toastr.error(res.errors[0].message);
        this.spinner.hide();
      }
    },
      err => {
        this.errorMsg(err);
      });
  }

  cancel() {
    this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
  }

  canDeactivate(component, route, state, next) {
    if (next.url.indexOf('/auth/login') > -1 || this.isPublished) {
      return true;
    }
    else {
      let isAtleastOneSkipToSelected = [];
      isAtleastOneSkipToSelected = this.flattenArrayOfArrays(this.skipForm.value.questionAndOptions, this.finalObject.questions);
      if (isAtleastOneSkipToSelected.length)
        return this.alertService.confirm();
      else
        return true;
    }
  }
}