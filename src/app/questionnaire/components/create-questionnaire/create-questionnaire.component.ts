import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import * as moment from 'moment';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { QuestionnaireService } from '../../questionnaire.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { LookupService } from 'src/app/services/util/lookup.service';
import { ValidationService } from 'src/app/components/validation-message/validation.service';

@Component({
  selector: 'app-create-questionnaire',
  templateUrl: './create-questionnaire.component.html',
  styleUrls: ['./create-questionnaire.component.scss']
})
export class CreateQuestionnaireComponent implements OnInit, AfterViewInit, AfterViewChecked {

  addQuestionnaireForm: FormGroup;
  editFlag: boolean = false;
  currentYear: any = new Date().getFullYear();
  defaultDate = moment(this.currentYear + '-12-31T00:00:00-00:00').format('MM/DD/YYYY');
  editId: any;
  data: any;
  questionnaireTypes: any = [];
  questionnaireCategories: any = [];

  isPublished: boolean = false; //Just to check if the user is trying to edit published questionnaire with the route known

  queryParams: any = {};

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private tabservice: TabserviceService,
    private alertService: AlertService,
    private customDatePipe: CustomDateFormatPipe,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private questionnaireService: QuestionnaireService,
    private lookupServ: LookupService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ) {

    this.addQuestionnaireForm = this.fb.group({
      questionnaireId: [],
      questionnaireName: ['', [Validators.required, ValidationService.whiteSpaceValidator, ValidationService.exceptSpecialChar]],
      questionnaireTypeId: ['', [Validators.required]],
      questionnaireTypeName: [''],
      questionnaireCategoryId: [''],
      questionnaireLevelId: [''],
      questionnaireCategoryName: [''],
      startDate: ['', [Validators.required]],
      endDate: [('12-31-' + this.currentYear), [Validators.required]],
      isActive: [true],
      isPublished: [false],
      status: [''],
      sections: this.fb.array([this.createSection()])
    });
    this.getQuesTypes();
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });

    this.data = this.tabservice.getModelData();
    // edit flag should be true when only route includes
    if (this.router.url.includes("/user/questionnaire/edit")) {
      this.editFlag = true;
      this.editId = this.router.url.split('edit/')[1].split('/')[0];
    }
    if (this.router.url.includes("/user/questionnaire/edit") && (!this.data || (this.data && !this.data.basicDetails))) {
      this.spinner.show();
      let resp: any;
      this.questionnaireService.getQuestionnaireById(`/api/questionnaire/${this.editId}`).subscribe(async res => {
        if (res.status.success === true) {

          //check and return if published
          this.isPublished = res.response.questionnaire.isPublished;
          if (this.isPublished) {
            this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
            this.spinner.hide();
            return;
          }

          let ques = res.response.questionnaire;

          ques?.questions?.forEach((q, i) => {
            ques.questions[i].preDefinedQuestion = ques.questions[i].question;
            if (ques.questions[i].questionImageUrl) {
              ques.questions[i].isQuesImg = true;
              ques.questions[i].quesImg = [{ name: ques.questions[i].questionImageName, url: ques.questions[i].questionImageUrl, type: 'image/*' }];
            }

            // To make isOption true for all the options along with "Others, specify and None of the above"
            q.questionAnswerOptions.forEach((o, j) => {
              ques.questions[i].questionAnswerOptions[j].isOption = true;
              if (o.ansOptionMediaUrl) {
                ques.questions[i].questionAnswerOptions[j].isOptImg = true;
                ques.questions[i].questionAnswerOptions[j].optImg = [{ name: ques.questions[i].questionAnswerOptions[j].ansOptionMediaName, url: ques.questions[i].questionAnswerOptions[j].ansOptionMediaUrl, type: 'image/*' }];
                ques.questions[i].questionAnswerOptions[j].ansOptionMediaType = 1;
              }
            });
          });
          resp = {
            basicDetails: {
              questionnaireId: ques.questionnaireId,
              questionnaireName: ques.questionnaireName,
              questionnaireTypeId: ques.questionnaireTypeId,
              questionnaireCategoryId: ques.questionnaireCategoryId,
              questionnaireLevelId: ques.questionnaireLevelId,
              startDate: this.customDatePipe.transform(ques.startDate, 'MM-dd-yyyy'),
              endDate: this.customDatePipe.transform(ques.endDate, 'MM-dd-yyyy'),
              isActive: ques.isActive,
              isPublished: ques.isPublished,
              status: !ques.isActive ? "Inactive" : (!ques.isPublished ? "Draft" : "Published"),
              sections: ques.sections
            },
            instructions: ques.instructions,
            addedQuestions: ques.questions
          }
          if (ques.questionnaireTypeId)
            await this.getQuestionnaireCategoryById(ques.questionnaireTypeId);
          await this.tabservice.setModelData(resp.basicDetails, 'basicDetails');
          await this.tabservice.setModelData(resp.instructions, 'instructions');
          await this.tabservice.setModelData(resp.addedQuestions, 'addedQuestions');
          await this.tabservice.setModelData(resp.addedQuestions, 'questions');
          await this.patchData();
          setTimeout(() => {
            this.spinner.hide();
          }, 300);
        }
        else {
          this.toastr.error(res.errors[0].message);
          this.spinner.hide();
        }
      },
        err => {
          if (err.status == 500) {
            this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
            this.spinner.hide();
          }
          else {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
            this.spinner.hide();
          }
        }
      );
    }
    else {
      this.patchData();
    }
  }

  createSection() {
    return this.fb.group({
      sectionId: [''],
      sectionName: [''],
      sectionDescription: [''],
      isUpdated: [false]
    });
  }

  getQuesTypes() {
    // GET /lookup/getQuestionnaireTypes
    this.spinner.show();
    this.lookupServ.getCommon('/api/lookup/getQuestionnaireTypes').subscribe(res => {
      if (res.status.success === true) {
        this.questionnaireTypes = res.response.questionnaireTypes;
        this.spinner.hide();
      }
      else {
        this.toastr.error(res.errors[0].message);
        this.spinner.hide();
      }
    }, err => {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      this.spinner.hide();
    });
  }

  questionnaireTypeSelect($event) {
    if ($event.target.value == '') {
      this.questionnaireCategories = [];
    }
    if ($event) {
      this.addQuestionnaireForm.patchValue({
        'questionnaireCategoryId': '',
        'questionnaireLevelId': ''
      });
      let questionnaireTypeId = $event.target.value;
      if (questionnaireTypeId == 2) {
        this.addQuestionnaireForm.controls['questionnaireCategoryId'].setValidators([Validators.required]);
        this.addQuestionnaireForm.controls['questionnaireLevelId'].clearValidators();
      }
      else {
        if (questionnaireTypeId == 1) {
          this.addQuestionnaireForm.controls['questionnaireLevelId'].setValidators([Validators.required]);
        }
        this.addQuestionnaireForm.controls['questionnaireCategoryId'].clearValidators();
      }
      this.addQuestionnaireForm.controls['questionnaireCategoryId'].updateValueAndValidity();
      this.addQuestionnaireForm.controls['questionnaireLevelId'].updateValueAndValidity();

      // GET /lookup/getQuestionnaireCategoryList/{questionnaireTypeId}
      if (questionnaireTypeId) {
        this.spinner.show();
        this.lookupServ.getCommon(`/api/lookup/getQuestionnaireCategoryList/${questionnaireTypeId}`).subscribe(res => {
          if (res.status.success === true) {
            this.questionnaireCategories = res.response.questionnaireCategories;
          }
          else {
            this.toastr.error(res.errors[0].message);
          }
          this.spinner.hide()
        }, err => {
          this.spinner.hide()
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        });
      }
    }
  }

  ngAfterViewInit() {

    if (!this.data || !this.data.basicDetails)
      this.addQuestionnaireForm.patchValue({ endDate: ('12-31-' + this.currentYear), status: 'Draft' })
  }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  patchData() {
    this.data = this.tabservice.getModelData();
    let res = this.data ? (this.data['basicDetails'] ? this.data['basicDetails'] : {}) : {};
    if (res.questionnaireTypeId)
      this.getQuestionnaireCategoryById(res.questionnaireTypeId);
    res.sections && res.sections?.forEach((section: any, i: number) => {
      if (i != 0)
        this.addSection();
      this.addQuestionnaireForm.get('sections')['controls'][i].patchValue(section);
    });
    this.addQuestionnaireForm.patchValue({
      'questionnaireId': res.questionnaireId ? res.questionnaireId : '',
      'questionnaireName': res.questionnaireName ? res.questionnaireName : '',
      'questionnaireTypeId': res.questionnaireTypeId ? res.questionnaireTypeId : '',
      'questionnaireCategoryId': res.questionnaireCategoryId ? res.questionnaireCategoryId : '',
      'questionnaireLevelId': res.questionnaireLevelId ? res.questionnaireLevelId : '',
      'startDate': res.startDate ? this.customDatePipe.transform(res.startDate, 'MM-dd-yyyy') : '',
      'endDate': res.endDate ? this.customDatePipe.transform(res.endDate, 'MM-dd-yyyy') : '',
      'isActive': res.isActive,
      'isPublished': res.isPublished,
      'status': res.status
    });
  }

  checkTabChange(url?) {
    this.addQuestionnaireForm.markAllAsTouched();
    if (this.addQuestionnaireForm.valid) {
      if (url && url.includes("preview-questionnaire") && !(this.data && this.data.questions && this.data.questions.length)) {
        this.toastr.error('Select/Add at least one question from questions tab.');
        return;
      }

      // check for duplicates and remove sections with empty value 
      for (let i = 0; i < this.addQuestionnaireForm.get('sections')['controls'].length; i++) {
        let section = this.addQuestionnaireForm.value.sections[i],
          dupSections = this.addQuestionnaireForm.value.sections.filter((sec: any, j: number) => ((sec.sectionName.toUpperCase().replace(/\s/g, '') == section.sectionName.toUpperCase().replace(/\s/g, '')) && sec.sectionName.replace(/\s/g, '') != '' && i != j));

        if (dupSections.length) {
          this.toastr.error(`${dupSections[0].sectionName} already exists.`);
          return false;
        }

        if (section.sectionName.replace(/\s/g, '') == '') {
          this.removeSection(i);
          --i;
        }
      }

      this.addQuestionnaireForm.patchValue({
        questionnaireTypeName: this.questionnaireTypes.filter(questionnaireType => questionnaireType.questionnaireTypeId == this.addQuestionnaireForm.value.questionnaireTypeId)[0].questionnaireType,
        questionnaireCategoryName: this.questionnaireCategories.filter(questionnaireCategory => questionnaireCategory.questionnaireCategoryId == this.addQuestionnaireForm.value.questionnaireCategoryId)[0]?.questionnaireCategory
      });
      this.tabservice.setModelData(this.addQuestionnaireForm.value, 'basicDetails');
      return true;
    }
    else {
      return false;
    }
  }

  backToList() {
    this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
  }

  next() {
    if (!this.editFlag)
      this.router.navigate(['/user/questionnaire/add/questionnaire-instructions'], { queryParams: this.queryParams });
    else
      this.router.navigate([`/user/questionnaire/edit/${this.editId}/questionnaire-instructions`], { queryParams: this.queryParams });
  }

  addSection() {
    let arr = this.addQuestionnaireForm.get('sections') as FormArray;
    if (arr.value.length == 5) {
      this.toastr.error("Maximum section limit of 5 sections has been reached.");
      return false;
    }
    arr.push(this.createSection());
  }

  removeSection(indx: number) {
    let arr = this.addQuestionnaireForm.get('sections') as FormArray;
    arr.removeAt(indx);
  }

  canDeactivate(component, route, state, next) {
    if (next.url.indexOf('/auth/login') > -1 || this.isPublished) {
      return true;
    }
    if (next.url.includes("/user/questionnaire/add") || next.url.includes("/user/questionnaire/edit") || next.url.includes("/login")) {
      return this.checkTabChange(next.url);
    }
    else {
      if (this.addQuestionnaireForm.touched)
        return this.alertService.confirm();
      else
        return true;
    }
  }

  async getQuestionnaireCategoryById(id) {
    this.spinner.show();
    this.lookupServ.getCommon(`/api/lookup/getQuestionnaireCategoryList/${id}`).subscribe(res => {
      if (res.status.success === true) {
        this.questionnaireCategories = res.response.questionnaireCategories;
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      this.spinner.hide()
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    });
  }

  secUpdated(secIndex: number) {
    this.addQuestionnaireForm.get('sections')['controls'][secIndex].patchValue({ isUpdated: true });
  }

}