import { ChangeDetectorRef, Component } from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormArray, AbstractControl, FormControl } from '@angular/forms';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Options } from 'sortablejs';
import { LookupService } from 'src/app/services/util/lookup.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { ValidationService } from 'src/app/components/validation-message/validation.service';
import { QuestionnaireService } from '../../questionnaire.service';
import { environment } from 'src/environments/environment.develop3';

@Component({
  selector: 'app-add-questions',
  templateUrl: './add-questions.component.html',
  styleUrls: ['./add-questions.component.scss', '../../styles/custom-slider.scss'],
})

export class AddQuestionsComponent {
  isExistQues: number = 1;
  preDefinedQuestions: any = [];
  questionTypes: any = [];
  selectedQuestions = [];
  isEditPreDefined: boolean = false;
  editFlag: boolean = false;
  editId: any;
  addQuesForm: FormGroup;
  editQuesForm: FormGroup;
  options1: Options = {
    group: {
      name: 'clone-group',
      pull: 'clone',
      put: false
    },
    onEnd: (event) => {
      this.checkIncludeDataExtract();
    },
  };
  options2: Options = {
    group: 'clone-group',
    draggable: 'false'
  };
  searchText = '';
  data: any;
  sections = [];
  queryParams: any = {};

  otherSpecifyText: string = environment.otherSpecifyText;
  noneOfTheAboveText: string = environment.noneOfTheAboveText;

  noneOfTheAboveOption = this.toUpperAndTrim(this.noneOfTheAboveText);
  othersOption = this.toUpperAndTrim(this.otherSpecifyText);

  //whether to include all the questions
  includeAll: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private lookupService: LookupService,
    private tabservice: TabserviceService,
    private questionnaireService: QuestionnaireService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
    private changeDetector: ChangeDetectorRef
  ) {
    this.addQuesForm = this.fb.group({
      questions: this.fb.array([])
    });

    // Form for predefined question edit
    this.editQuesForm = this.fb.group({
      index: [],
      preDefinedQuestionId: [],
      preDefinedQuestion: ['', [Validators.required, ValidationService.whiteSpaceValidator]],
      file: [''], //just for file upload formcontrol
      isQuesImg: [false], //show and hide the upload button
      quesImg: [''], //to show the preview of the file
      questionImageName: [''], //send the image name to api
      questionImageUrl: [''], //get the image url (uploaded to google cloud)
      questionTypeId: [0, [Validators.required]],
      section: [null],
      isMandatory: [false],
      saveForFuture: [false],
      questionAnswerOptions: this.fb.array([this.createQuesAns()]),
      isUpdated: [false],
      other: this.fb.group(
        {
          floor: [, [Validators.min(0)]],
          floorDescription: [''],
          ceil: [],
          ceilDescription: [''],
          tickStep: [],
          disabled: true,
          isContinuousScale: false,
          isVerticalScale: false,
          getLegend: (value: number): string => {
            return '' + value;
          }
        }
      ),
      questionId: [], //Only for backend reference
      suffleOptionOrder: [false],
      validityPeriod: ['', [Validators.pattern("^[0-9]*$"), Validators.min(1), Validators.max(999)]],
      isIncludeInDataExtract: [false]
    });
  }

  createQuestion(): FormGroup {
    return this.fb.group({
      preDefinedQuestionId: [],
      preDefinedQuestion: ['', [Validators.required, ValidationService.whiteSpaceValidator]],
      file: [''], //just for file upload formcontrol
      isQuesImg: [false], //show and hide the upload button
      quesImg: [''], //to show the preview of the file
      questionImageName: [''], //send the image name to api
      questionImageUrl: [''], //get the image url (uploaded to google cloud)
      questionId: [],
      questionTypeId: [1],
      section: [null],
      isMandatory: [false],
      saveForFuture: [false],
      questionAnswerOptions: this.fb.array([this.createQuesAns()]),
      isUpdated: [false],
      other: this.fb.group(
        {
          floor: [, [Validators.min(0)]],
          floorDescription: [''],
          ceil: [],
          ceilDescription: [''],
          tickStep: [],
          disabled: true,
          isContinuousScale: false,
          isVerticalScale: false,
          getLegend: (value: number): string => {
            return '' + value;
          }
        }
      ),
      suffleOptionOrder: [false],
      validityPeriod: ['', [Validators.pattern("^[0-9]*$"), Validators.min(1), Validators.max(999)]],
      isIncludeInDataExtract: [false]
    });
  }

  createQuesAns(): FormGroup {
    return this.fb.group({
      questionAnswerId: [],
      questionAnswer: ['', [Validators.required]],
      submitQuestionnaire: [false],
      isOption: [true], // by default isOption will be true for all the options except none of the above/ others, specify. This is being used for differentiating the "others, specify and none of the above" with other options
      file: [''], //just for file upload formcontrol	
      isOptImg: [false], //show and hide the upload button	
      optImg: [''], //to show the preview of the file	
      ansOptionMediaName: [''], //send the image name to api	
      ansOptionMediaUrl: [''], //get the image url (uploaded to google cloud)
      ansOptionMediaType: 1 //For backend purpose
    });
  }

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });

    this.getInitialData();
    if (this.router.url.includes("/user/questionnaire/edit")) {
      this.editFlag = true;
      this.editId = this.router.url.split('edit/')[1].split('/')[0];
      this.isExistQues = 2;
    }
    this.patchData();
  }

  patchData() {
    this.data = this.tabservice.getModelData();
    if (!this.data) {
      if (!this.editFlag)
        this.router.navigate(['/user/questionnaire/add/basic-details'], { queryParams: this.queryParams });
      else
        this.router.navigate([`/user/questionnaire/edit/${this.editId}/basic-details`], { queryParams: this.queryParams });
      return;
    }
    this.sections = this.data['basicDetails'].sections;
    this.selectedQuestions = this.data ? (this.data['selectedQuestions'] ? this.data['selectedQuestions'] : []) : [];
    let addQuestions = this.data ? (this.data['addedQuestions'] ? this.data['addedQuestions'] : []) : [];
    if (addQuestions.length) {
      for (var i = 0; i < addQuestions.length; i++) {
        let ques = addQuestions[i];
        this.addQues();
        /* let quesArr = this.addQuesForm.get('questions') as FormArray;
        quesArr.push(this.createQuestion()); */

        let quesCtrl: any = this.addQuesForm.get('questions')['controls'][i],
          quesAnswersCtrl: any = quesCtrl.get('questionAnswerOptions') as FormArray;

        // To patch section
        if (ques.section?.sectionName && this.sections.length) {
          let selectedSection = this.sections.filter((sec: any) => sec.sectionName == ques.section.sectionName);
          if (selectedSection.length)
            ques.section = selectedSection[0];
          else
            ques.section = null;
        }

        // To patch only question
        let onlyQues = { ...ques };
        delete onlyQues.questionAnswerOptions;

        // To remove "None of the above & Others, specify options for question type other than dropdown, checkbox and radio buton"
        this.typeChanged(ques.questionTypeId, 'addQues', i);

        quesCtrl.patchValue(onlyQues);

        if (ques.questionTypeId === 4 || ques.questionTypeId === 5 || ques.questionTypeId === 7 || ques.questionTypeId === 8 || ques.questionTypeId === 9) {
          let arr = quesAnswersCtrl as FormArray;
          arr.controls = [];
          arr.patchValue([]);
        }
        for (var j = 0; j < ques.questionAnswerOptions.length; j++) {
          let opt = ques.questionAnswerOptions[j],
            currentOption = this.toUpperAndTrim(opt.questionAnswer);
          if (j != 0) {
            // create option for all the question types, except for dropdown, checkbox and radio buttons having none of the above or others, specify as they were created while creating the question it self
            if ((ques.questionTypeId == 1 || ques.questionTypeId == 2 || ques.questionTypeId == 3)) {
              if (currentOption != this.noneOfTheAboveOption && currentOption != this.othersOption)
                this.addQuesAns('addQues', i);
            }
            else
              this.addQuesAns('addQues', i);
          }
          else {
            if (ques.questionTypeId == 6) {
              this.setValidator(quesAnswersCtrl['controls'][j].get('questionAnswer'), [Validators.maxLength(30), Validators.required]);
              this.setSliderValidators(quesCtrl.get('other'));
            }
          }

          if (currentOption != this.noneOfTheAboveOption && currentOption != this.othersOption) {
            quesAnswersCtrl['controls'][j].patchValue(opt);
          }
          else {
            let index: number;
            if (currentOption == this.noneOfTheAboveOption) {
              index = quesAnswersCtrl.value.findIndex((option: any) => this.toUpperAndTrim(option.questionAnswer) == currentOption);
            }
            else if (currentOption == this.othersOption) {
              index = quesAnswersCtrl.value.findIndex((option: any) => this.toUpperAndTrim(option.questionAnswer) == currentOption);
            }
            quesAnswersCtrl['controls'][index].patchValue(opt);
          }
        }
      }
    }

    this.verifyisAllInclude();
  }

  toUpperAndTrim(string: any) {
    if (string)
      return string.toUpperCase().replace(/\s/g, '');
    return '';
  }

  async getInitialData() {
    this.spinner.show();
    // QuestionTypes
    await this.lookupService.getQuestionType('/api/lookup/getQuestionType').subscribe(res => {
      if (res.status.success === true) {
        this.questionTypes = res.response.questionTypes;
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

    // PreDefinedQuestions
    this.getPreDefinedQuestions();
  }

  getPreDefinedQuestions() {
    this.spinner.show();
    this.lookupService.getPredefinedQuestions(`/api/lookup/getPreDefinedQuestions?searchText=${this.searchText}`).subscribe(res => {
      if (res.status.success === true) {
        this.preDefinedQuestions = res.response.preDefinedQuestions;
        this.preDefinedQuestions.forEach((element: any, quesIndex: number) => {
          if (element.preDefinedQuestionId) {
            // element['questionId'] = element.preDefinedQuestionId;
            this.preDefinedQuestions[quesIndex]['other'].disabled = true;
            this.preDefinedQuestions[quesIndex]['other'].showTicks = !element['other'].isContinuousScale;
            this.preDefinedQuestions[quesIndex]['other'].vertical = element['other'].isVerticalScale;
            element['other'].getLegend = (value: number): string => {
              return value != element['other'].ceil ? '' + value : '';
            }

            element.questionAnswerOptions.forEach((option: any, optionIndex: any) => {
              this.preDefinedQuestions[quesIndex].questionAnswerOptions[optionIndex].isOption = true;
            })
          }
        });
        this.spinner.hide();
      }
      else {
        this.toastr.error(res.errors[0].message);
        this.spinner.hide();
      }
    },
      err => {
        this.spinner.hide();
        if (err.status == 500) {
          this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
        }
        else {
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        }
      }
    );
  }

  formReset(formName) {
    if (formName === 'editQues') {
      this.editQuesForm.reset();
      this.isEditPreDefined = false;
    }
  }

  quesUpdated(indx) {
    this.addQuesForm.get('questions')['controls'][indx].patchValue({ isUpdated: true });
  }

  setSliderValidators(ctrls: AbstractControl) {
    let keys = ['floor', 'ceil', 'tickStep', 'floorDescription', 'ceilDescription'];
    keys.forEach((key) => {
      let validators = [Validators.required];
      if (key == 'floor')
        validators.push(Validators.min(0));
      this.setValidator(ctrls.get(key), validators);
    });
    this.changeDetector.detectChanges();
  }

  resetSliderValidators(ctrls: AbstractControl) {
    let keys = ['floor', 'ceil', 'tickStep', 'floorDescription', 'ceilDescription'];
    keys.forEach((key) => {
      this.clearValidator(ctrls.get(key));
    });
  }

  typeChanged(value, formName, quesIndx?) {
    let arr, newQuestionCtrl;

    if (formName === 'editQues')
      newQuestionCtrl = this.editQuesForm;
    else
      newQuestionCtrl = this.addQuesForm.get('questions')['controls'][quesIndx];

    //reset to defaults
    newQuestionCtrl.patchValue({ suffleOptionOrder: false, validityPeriod: '', isIncludeInDataExtract: this.includeAll });

    if (formName === 'editQues') {
      arr = newQuestionCtrl.get('questionAnswerOptions') as FormArray;
      newQuestionCtrl.get('other').patchValue({ floor: '', ceil: '', tickStep: '', floorDesctiption: '', ceilDescription: '' });

      if (value === 6) {
        this.setSliderValidators(newQuestionCtrl.get('other'));
      }
      else {
        this.resetSliderValidators(newQuestionCtrl.get('other'));
      }
    }
    else {
      arr = newQuestionCtrl.get('questionAnswerOptions') as FormArray;
      newQuestionCtrl.get('other').patchValue({ floor: '', ceil: '', tickStep: '', floorDesctiption: '', ceilDescription: '' });
      this.quesUpdated(quesIndx);

      if (value === 6) {
        this.setSliderValidators(newQuestionCtrl.get('other'));
      }
      else {
        this.resetSliderValidators(newQuestionCtrl.get('other'));
      }
    }

    if (value == 1 || value == 2 || value == 3) {
      if (arr.value.length) {
        arr.controls.forEach((quesAnswr: any) => {
          quesAnswr.get('submitQuestionnaire').patchValue(false);
          this.setValidator(quesAnswr.get('questionAnswer'), [Validators.required]);
        });
      }
      else {
        arr.push(this.createQuesAns());
      }

      // For adding others, specify & none of the above options
      let hasDefaultOption = arr.value.filter((option: any) => this.toUpperAndTrim(option.questionAnswer) == this.othersOption || this.toUpperAndTrim(option.questionAnswer) == this.noneOfTheAboveOption);
      if (!hasDefaultOption.length) {
        this.addDefaultOptions(newQuestionCtrl);
      }
    }
    else {
      arr.controls = [];
      arr.patchValue([]);
      if (value == 6) {
        arr.push(this.createQuesAns());
        arr.controls.forEach((quesAnswr: any) => {
          this.setValidator(quesAnswr.get('questionAnswer'), [Validators.maxLength(30), Validators.required]);
        });
      }
    }
  }

  editPreDefinedQuestion(question, i) {
    this.editQuesForm.reset();
    if (question.questionTypeId === 4 || question.questionTypeId === 5 || question.questionTypeId === 7 || question.questionTypeId === 8 || question.questionTypeId === 9) {
      question.questionAnswerOptions = [];
    }
    this.resetSliderValidators(this.editQuesForm.get('other'));
    this.spinner.show();
    this.isEditPreDefined = true;
    question.index = i;

    let questionAnswerOptions: FormArray = this.editQuesForm.get('questionAnswerOptions') as FormArray;
    questionAnswerOptions.controls = [];

    // To patch only question
    let onlyQues = { ...question };
    delete onlyQues.questionAnswerOptions;
    if (onlyQues.questionImageUrl) {
      onlyQues.isQuesImg = true;
      onlyQues.quesImg = [{ name: onlyQues.questionImageName, url: onlyQues.questionImageUrl, type: 'image/*' }];
    }

    this.editQuesForm.patchValue(onlyQues);

    if (question.questionTypeId == 1 || question.questionTypeId == 2 || question.questionTypeId == 3 || question.questionTypeId == 6) {
      questionAnswerOptions.push(this.createQuesAns());
      if (question.questionTypeId != 6) {
        this.addDefaultOptions(this.editQuesForm);
      }
    }

    question.questionAnswerOptions.forEach((opt, i) => {
      if (opt.ansOptionMediaUrl) {
        opt.isOptImg = true;
        opt.optImg = [{ name: opt.ansOptionMediaName, url: opt.ansOptionMediaUrl, type: 'image/*' }];
        opt.ansOptionMediaType = 1;
      }
      let currentOption = this.toUpperAndTrim(opt.questionAnswer);
      if (i != 0) {
        // create option for all the question types, except for dropdown, checkbox and radio buttons having none of the above or others, specify as they were created while creating the question it self
        if ((question.questionTypeId == 1 || question.questionTypeId == 2 || question.questionTypeId == 3)) {
          if (currentOption != this.noneOfTheAboveOption && currentOption != this.othersOption)
            this.addQuesAns('editQues', i);
        }
        else
          this.addQuesAns('editQues', i);
      }

      if (question.questionTypeId == 6) {
        this.setSliderValidators(this.editQuesForm.get('other'));
        this.setValidator(this.editQuesForm.controls.questionAnswerOptions['controls'][i].get('questionAnswer'), [Validators.maxLength(30), Validators.required]);
      }

      if (currentOption != this.noneOfTheAboveOption && currentOption != this.othersOption) {
        questionAnswerOptions['controls'][i].patchValue(opt);
      }
      else {
        let index: number;
        if (currentOption == this.noneOfTheAboveOption) {
          index = questionAnswerOptions.value.findIndex((option: any) => this.toUpperAndTrim(option.questionAnswer) == currentOption);
        }
        else if (currentOption == this.othersOption) {
          index = questionAnswerOptions.value.findIndex((option: any) => this.toUpperAndTrim(option.questionAnswer) == currentOption);
        }
        questionAnswerOptions['controls'][index].patchValue(opt);
      }
    });

    setTimeout(() => {
      this.spinner.hide();
    }, 300);
  }

  delPreDefinedQuestion(i) {
    this.spinner.show();
    this.selectedQuestions.splice(i, 1);
    this.editQuesForm.reset();
    this.isEditPreDefined = false;
    setTimeout(() => {
      this.spinner.hide();
    }, 300);
    this.toastr.success('Question has been deleted successfully from this questionnaire.');
  }

  updateSelectedQues() {
    this.editQuesForm.markAllAsTouched();
    if (this.editQuesForm.valid) {

      // To check whether the image is uploaded when "Add Image" is checked for question
      if (this.editQuesForm.value.isQuesImg && !this.editQuesForm.value.questionImageName) {
        return this.noImageForImgQues();
      }

      // To check whether a section is selected if there are sections added
      if (this.sections.length && !this.editQuesForm.value.section?.sectionName) {
        return this.noSectionForQues();
      }

      // To check whether all the questions have multiple options
      if (this.editQuesForm.value.questionTypeId == 1 || this.editQuesForm.value.questionTypeId == 2 || this.editQuesForm.value.questionTypeId == 3) {
        let optionLength = this.editQuesForm.value.questionAnswerOptions.filter((opt: any) => (opt.isOption)).length;
        if (optionLength <= 1)
          return this.hasSingleOptionForQues();
      }

      // To check whether the image is uploaded when "Add Image" is checked for option
      if (this.editQuesForm.value.questionTypeId == 2 || this.editQuesForm.value.questionTypeId == 3) {
        let hasImg = this.editQuesForm.value.questionAnswerOptions.filter((opt: any) => (opt.isOptImg && !opt.ansOptionMediaName));
        if (hasImg.length)
          return this.noImageForImgOpt();
      }

      this.spinner.show();
      this.editQuesForm.patchValue({ isUpdated: true });
      this.selectedQuestions[this.editQuesForm.value.index] = this.editQuesForm.value;
      this.editQuesForm.reset();
      this.isEditPreDefined = false;
      setTimeout(() => {
        this.spinner.hide();
      }, 300);
      this.toastr.success('Question has been updated successfully for this questionnaire.');

      //To check or uncheck "Include all questions in Data Extract" on updating the pre-defined question
      this.verifyisAllInclude();
    }
    else {
      this.toastr.error('Please enter a valid question with valid options', 'Error!');
    }
  }

  removeQuesAns(formName, ansIndx, quesIndx) {
    let ansArr;
    if (formName === 'addQues') {
      ansArr = this.addQuesForm.get('questions')['controls'][quesIndx].get('questionAnswerOptions') as FormArray;
      ansArr.removeAt(ansIndx);
      this.addQuesForm.get('questions')['controls'][quesIndx].patchValue({ isUpdated: true });
    }
    else {
      ansArr = this.editQuesForm.get('questionAnswerOptions') as FormArray;
      ansArr.removeAt(ansIndx);
    }

    // if all the other options were selected for submit quesitonnaire except last and last option is deleted
    if (ansArr.controls.length > 1)
      this.checkIfAllOptionsSelectedForSubmit(formName, ansIndx - 1, quesIndx);
  }

  addQuesAns(formName, quesIndx) {
    let questionAnswerOptions: FormArray;
    if (formName === 'addQues') {
      this.addQuesForm.get('questions')['controls'][quesIndx].get('questionAnswerOptions').markAllAsTouched();
      if (this.addQuesForm.get('questions')['controls'][quesIndx].get('questionAnswerOptions').valid) {
        questionAnswerOptions = this.addQuesForm.get('questions')['controls'][quesIndx].get('questionAnswerOptions') as FormArray;

        // For dropdown, radio and checkbox options, we have to push to last but two as "Others, specify & None of the above should be last"
        if (this.addQuesForm.value.questions[quesIndx].questionTypeId == 1 || this.addQuesForm.value.questions[quesIndx].questionTypeId == 2 || this.addQuesForm.value.questions[quesIndx].questionTypeId == 3) {
          questionAnswerOptions.insert(questionAnswerOptions.length - 2, this.createQuesAns());
        }
        else
          questionAnswerOptions.push(this.createQuesAns());


        // For slider option restriction to max 30 characters
        if (this.addQuesForm.value.questions[quesIndx].questionTypeId == 6) {
          this.setValidator(questionAnswerOptions.at(questionAnswerOptions.length - 1).get('questionAnswer'), [Validators.maxLength(30), Validators.required]);
        }
      }
      else {
        this.toastr.error('Please add a valid option to continue', 'Error!');
      }
    }
    else {
      this.editQuesForm.get('questionAnswerOptions').markAllAsTouched();
      if (this.editQuesForm.get('questionAnswerOptions').valid) {
        questionAnswerOptions = this.editQuesForm.get('questionAnswerOptions') as FormArray;

        // For dropdown, radio and checkbox options, we have to push to last but two as "Others, specify & None of the above should be last"
        if (this.editQuesForm.value.questionTypeId == 1 || this.editQuesForm.value.questionTypeId == 2 || this.editQuesForm.value.questionTypeId == 3) {
          questionAnswerOptions.insert(questionAnswerOptions.length - 2, this.createQuesAns());
        }
        else
          questionAnswerOptions.push(this.createQuesAns());

        // For slider option restriction to max 30 characters
        if (this.editQuesForm.value.questionTypeId == 6) {
          this.setValidator(questionAnswerOptions.at(questionAnswerOptions.length - 1).get('questionAnswer'), [Validators.maxLength(30), Validators.required]);
        }
      }
      else {
        this.toastr.error('Please add a valid option to continue', 'Error!');
      }
    }
  }

  addQues() {
    this.addQuesForm.markAllAsTouched();
    if (this.addQuesForm.valid) {
      let quesArr = this.addQuesForm.get('questions') as FormArray;
      quesArr.push(this.createQuestion());

      // For adding others, specify & none of the above options
      let newQuestionCtrl = this.addQuesForm.get('questions')['controls'][quesArr.length - 1];
      this.addDefaultOptions(newQuestionCtrl);

      newQuestionCtrl.get('isIncludeInDataExtract').patchValue(this.includeAll);
    }
    else {
      this.toastr.error('Please enter a valid question with valid options', 'Error!');
    }
  }

  addDefaultOptions(newQuestionCtrl) {
    if (newQuestionCtrl.value.questionTypeId == 1 || newQuestionCtrl.value.questionTypeId == 2 || newQuestionCtrl.value.questionTypeId == 3) {
      let questionAnswerOptions = newQuestionCtrl.get('questionAnswerOptions') as FormArray;
      let otherSpecifyOption = this.createQuesAns(), noneOfTheAboveOption = this.createQuesAns();
      otherSpecifyOption.patchValue({ questionAnswer: this.otherSpecifyText, isOption: false });
      noneOfTheAboveOption.patchValue({ questionAnswer: this.noneOfTheAboveText, isOption: false });
      questionAnswerOptions.push(otherSpecifyOption);
      questionAnswerOptions.push(noneOfTheAboveOption);
    }
  }

  removeQues(indx) {
    let quesArr = this.addQuesForm.get('questions') as FormArray;
    quesArr.removeAt(indx);
  }

  minMaxCompare(ctrl: any) {
    if (ctrl.value.other.ceil != null && ctrl.value.other.floor != null) {
      this.setValidator(ctrl.get('other').get('ceil'), [Validators.required, Validators.min(ctrl.value.other.floor + 1), (ctrl.value.other.isContinuousScale ? Validators.max(100) : Validators.max(15))]);
    }
    else {
      this.setValidator(ctrl.get('other').get('floor'), [Validators.min(0), Validators.required]);
      this.setValidator(ctrl.get('other').get('ceil'), [Validators.required]);
    }
    this.stepValidation(ctrl);
  }

  stepValidation(ctrl: any) {
    if (ctrl.value.other.ceil != null && ctrl.value.other.floor != null && ctrl.value.other.tickStep != null) {
      this.setValidator(ctrl.get('other').get('tickStep'), [Validators.required, Validators.min(1), Validators.max(ctrl.value.other.ceil - ctrl.value.other.floor)]);
    }
    else {
      this.setValidator(ctrl.get('other').get('tickStep'), [Validators.required]);
    }
  }

  back() {
    if (!this.editFlag)
      this.router.navigate(['/user/questionnaire/add/questionnaire-instructions'], { queryParams: this.queryParams });
    else
      this.router.navigate([`/user/questionnaire/edit/${this.editId}/questionnaire-instructions`], { queryParams: this.queryParams });
  }

  checkTabChange(next?) {
    this.addQuesForm.markAllAsTouched();
    if ((this.selectedQuestions.length || (this.addQuesForm.value.questions && this.addQuesForm.value.questions.length))) {
      if (!this.addQuesForm.valid) {
        this.toastr.error('Please enter valid questions with valid options', 'Error!');
        return false;
      }
      // To make the options array as empty if text or textarea (after selecting question which is not edited)
      this.selectedQuestions.forEach((ques, i) => {
        if (ques.questionAnswerOptions.length === 1 && Object.keys(ques.questionAnswerOptions[0]).length === 0) {
          this.selectedQuestions[i].questionAnswerOptions = [];
        }
      });

      let finalQuestions = [],
        isAtleastOneQuesMandatory: boolean = false,
        isImgQuesHasImg: boolean = true,
        isImgOptHasImg: boolean = true,
        hasSection: boolean = true,
        hasSingleOption: boolean = false;
      finalQuestions = finalQuestions.concat(...this.selectedQuestions, ...this.addQuesForm.value.questions);
      finalQuestions.forEach((ques, i) => {
        finalQuestions[i].questionType = this.questionTypes.filter(type => type.questionTypeId === ques.questionTypeId)[0].questionType;
        finalQuestions[i].question = ques.preDefinedQuestion;

        // To check whether the question with "add image" selected, has image
        if (ques.isQuesImg && !ques.questionImageName) {
          isImgQuesHasImg = false;
        }

        // To check whether question is mapped to section
        if (this.sections.length && !ques?.section?.sectionName)
          hasSection = false;

        // To check whether all the questions have multiple options
        if (ques.questionTypeId == 1 || ques.questionTypeId == 2 || ques.questionTypeId == 3) {
          let optionLength = ques.questionAnswerOptions.filter((opt: any) => (opt.isOption)).length;
          if (optionLength <= 1)
            hasSingleOption = true;
        }

        // To check whether the options with "add image", has image
        if (ques.questionTypeId == 2 || ques.questionTypeId == 3) {
          let hasImg = ques.questionAnswerOptions.filter((opt: any) => (opt.isOptImg && !opt.ansOptionMediaName));
          if (hasImg.length)
            isImgOptHasImg = false;
        }

        // To check whether at least one question is selected as mandatory
        if (ques.isMandatory)
          isAtleastOneQuesMandatory = true;
      });

      if (!isImgQuesHasImg) {
        return this.noImageForImgQues();
      }

      if (!hasSection) {
        return this.noSectionForQues();
      }

      if (hasSingleOption) {
        return this.hasSingleOptionForQues();
      }

      if (!isImgOptHasImg) {
        return this.noImageForImgOpt();
      }

      if (!isAtleastOneQuesMandatory) {
        this.toastr.error('Please select at least one question as mandatory');
        return false;
      }

      this.tabservice.setModelData(this.selectedQuestions, 'selectedQuestions');
      this.tabservice.setModelData(this.addQuesForm.value.questions, 'addedQuestions');
      this.tabservice.setModelData(finalQuestions, 'questions');
      return true;
    }
    else if (!this.editFlag && (next === '/user/questionnaire/add/questionnaire-instructions' || next === '/user/questionnaire/add/basic-details')) {
      this.tabservice.setModelData([], 'selectedQuestions');
      this.tabservice.setModelData([], 'addedQuestions');
      this.tabservice.setModelData([], 'questions');
      return true;
    }
    else if (this.editFlag && (next === `/user/questionnaire/edit/${this.editId}/questionnaire-instructions` || next === `/user/questionnaire/edit/${this.editId}/basic-details`)) {
      this.tabservice.setModelData([], 'selectedQuestions');
      this.tabservice.setModelData([], 'addedQuestions');
      this.tabservice.setModelData([], 'questions');
      return true;
    }
    else if (!(this.selectedQuestions.length || (this.addQuesForm.value.questions && this.addQuesForm.value.questions.length))) {
      this.toastr.error('Select/Add at least one question from questions tab');
      return false;
    }
    else {
      return false;
    }
  }

  next() {
    if (!this.editFlag)
      this.router.navigate(['/user/questionnaire/add/preview-questionnaire'], { queryParams: this.queryParams });
    else
      this.router.navigate([`/user/questionnaire/edit/${this.editId}/preview-questionnaire`], { queryParams: this.queryParams });
  }

  setValidator(ctrl: any, validators: any) {
    ctrl.setValidators(validators);
    ctrl.updateValueAndValidity();
  }

  clearValidator(ctrl: any) {
    ctrl.clearValidators();
    ctrl.updateValueAndValidity();
  }

  selectQuesFileResult(event, index?: number) {
    let controls = this.removeQuesImg(index);
    if (event.length == 0) {
      return false;
    }
    controls.get('quesImg').patchValue(event);
    this.uploadQuesImg(index);
  }

  async uploadQuesImg(index?: number) {
    let controls: any;
    if (index >= 0) {
      controls = this.addQuesForm.controls.questions['controls'][index];
    }
    else {
      controls = this.editQuesForm;
    }
    if (controls.value.quesImg && controls.value.quesImg.length == 0) {
      this.toastr.error('Please select a valid file for uploading.', 'Error!');
      return;
    }
    let formData = new FormData();
    controls.value.quesImg && controls.value.quesImg.forEach(element => {
      formData.append("file", element);
    });
    formData.append("moduleName", 'Questionnaire');
    this.spinner.show();
    this.questionnaireService.bulkUpload('/api/fileUpload/bulkUpload', formData).subscribe((res) => {
      if (res.response && res.response.length) {
        let img = controls.value.quesImg[0].name;
        controls.get('questionImageName').patchValue(res.response[0][img]);
        this.spinner.hide();
      }
      else {
        this.toastr.error("Please try after sometime or contact administrator.");
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
      });
  }

  removeQuesImg(index?: number) {
    let controls: any;
    if (index >= 0) {
      controls = this.addQuesForm.controls.questions['controls'][index];
    }
    else {
      controls = this.editQuesForm;
    }
    //isUpdated: true is used to set that particular question is updated during edit. During add this is not considered in backend
    controls.patchValue({ quesImg: '', questionImageName: '', questionImageUrl: '', isUpdated: this.editFlag });
    return controls;
  }

  selectQuesAnsFileResult(event, optIndex: number, quesIndex?: number) {
    let { controls, optControls } = this.removeQuesAnsImg(optIndex, quesIndex);
    if (event.length == 0) {
      return false;
    }
    optControls.get('optImg').patchValue(event);
    this.uploadQuesAnsImg(optIndex, quesIndex);
  }

  async uploadQuesAnsImg(optIndex: number, quesIndex?: number) {
    let controls: any, optControls: any;
    if (quesIndex >= 0) {
      controls = this.addQuesForm.controls.questions['controls'][quesIndex];
    }
    else {
      controls = this.editQuesForm;
    }
    optControls = controls.get('questionAnswerOptions')['controls'][optIndex];
    if (optControls.value.optImg && optControls.value.optImg.length == 0) {
      this.toastr.error('Please select a valid file for uploading.', 'Error!');
      return;
    }
    let formData = new FormData();
    optControls.value.optImg && optControls.value.optImg.forEach(element => {
      formData.append("file", element);
    });
    formData.append("moduleName", 'Questionnaire');
    this.spinner.show();
    this.questionnaireService.bulkUpload('/api/fileUpload/bulkUpload', formData).subscribe((res) => {
      if (res.response && res.response.length) {
        let img = optControls.value.optImg[0].name;
        optControls.get('ansOptionMediaName').patchValue(res.response[0][img]);
        this.spinner.hide();
      }
      else {
        this.toastr.error("Please try after sometime or contact administrator.");
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
      });
  }

  removeQuesAnsImg(optIndex: number, quesIndex?: number) {
    let controls: any, optControls: any;
    if (quesIndex >= 0) {
      controls = this.addQuesForm.get('questions')['controls'][quesIndex];
    }
    else {
      controls = this.editQuesForm;
    }
    optControls = controls.get('questionAnswerOptions')['controls'][optIndex];

    //isUpdated: true is used to set that particular question is updated during edit. During add this is not considered in backend
    controls.patchValue({ isUpdated: this.editFlag });
    optControls.patchValue({ optImg: '', ansOptionMediaName: '', ansOptionMediaUrl: '' });
    return { controls, optControls };
  }

  noImageForImgQues() {
    this.toastr.error('Please upload image for the question in which "Add Image" is selected');
    return false;
  }

  noImageForImgOpt() {
    this.toastr.error('Please upload image for the option in which "Add Image" is selected');
    return false;
  }

  noSectionForQues() {
    this.toastr.error('Selecting section for a question is mandatory.');
    return false;
  }

  hasSingleOptionForQues() {
    this.toastr.error('More than one option must be provided to question.');
    return false;
  }

  //For validating if all the questions options were selected for auto submit questionnaire
  checkIfAllOptionsSelectedForSubmit(formName: string, optionIndx: number, quesIndx?: number) {
    let ctrl: any;
    if (formName === 'addQues')
      ctrl = this.addQuesForm.get('questions')['controls'][quesIndx].get('questionAnswerOptions') as FormArray;
    else
      ctrl = this.editQuesForm.get('questionAnswerOptions') as FormArray;
    if (ctrl.value.length > 1) {
      let unSelectedForAutoSubmit = ctrl.value.filter((option: any) => !option.submitQuestionnaire && option.isOption && option.questionAnswer != this.otherSpecifyText);
      if (!unSelectedForAutoSubmit.length) {
        ctrl['controls'][optionIndx].patchValue({ submitQuestionnaire: false });
        this.toastr.error('Cannot select all options of a question for submit questionnaire', 'Error!');
      }
    }
  }

  // check if "None of the above or others, specify" is selected
  noneOrOthers(formName: string, optionIndx: number, quesIndx?: number) {
    let questionCtrl: any, optionCtrl: any;
    if (formName === 'addQues') {
      questionCtrl = this.addQuesForm.get('questions')['controls'][quesIndx].get('questionAnswerOptions') as FormArray;
    }
    else {
      questionCtrl = this.editQuesForm.get('questionAnswerOptions') as FormArray;
    }

    optionCtrl = questionCtrl['controls'][optionIndx];

    if (!optionCtrl.value.isOption) {
      // make the submitQuestionnaire as false if it is selected previously
      optionCtrl.patchValue({ submitQuestionnaire: false });
    }
  }

  // check if the question answer typed is "None of the above or others, specify"
  checkIfNoneOrOthers(optionIndex: number, questionIndex?: number) {
    let controls: any;
    if (questionIndex >= 0) {
      controls = this.addQuesForm.controls.questions['controls'][questionIndex];
    }
    else {
      controls = this.editQuesForm;
    }
    let optionControl: any = controls.get('questionAnswerOptions')['controls'][optionIndex];

    let currentOption = this.toUpperAndTrim(optionControl.value.questionAnswer);
    if (currentOption == this.noneOfTheAboveOption || currentOption == this.othersOption) {
      optionControl.patchValue({ questionAnswer: '' });
      this.toastr.error(`Cannot add ${this.otherSpecifyText} or ${this.noneOfTheAboveText}`);
    }
  }

  //check or uncheck data extract for all the questions (both new and pre-defined)
  checkIncludeDataExtract() {
    //For all the pre-defined question
    this.selectedQuestions.forEach((preDefinedSelectedQues: any) => {
      preDefinedSelectedQues.isIncludeInDataExtract = this.includeAll;

      if (!this.includeAll)
        preDefinedSelectedQues.validityPeriod = '';
    });

    //For the pre-defined question that is currently in edit mode 
    this.editQuesForm.get('isIncludeInDataExtract').patchValue(this.includeAll);
    if (!this.includeAll)
      this.editQuesForm.get('validityPeriod').patchValue('');

    //For all the questions in "Add Questions"
    let questionCtrls = this.addQuesForm.get('questions') as FormArray;
    questionCtrls.controls.forEach((ques: any, i: number) => {
      ques.get('isIncludeInDataExtract').patchValue(this.includeAll);

      if (!this.includeAll)
        ques.get('validityPeriod').patchValue('');

      //To update the isUpdated flag
      this.quesUpdated(i);
    });
  }

  //To check or uncheck "Include all questions in Data Extract"
  verifyisAllInclude(index?: number) {
    let hasNotIncluded: boolean | number = false;

    //For all the pre-defined question
    hasNotIncluded = (this.selectedQuestions.filter((preDefinedSelectedQues: any) => !preDefinedSelectedQues.isIncludeInDataExtract)).length;

    //For all the questions in "Add Questions"
    if (hasNotIncluded <= 0)
      hasNotIncluded = (this.addQuesForm.value.questions.filter((ques: any) => !ques.isIncludeInDataExtract)).length;

    this.includeAll = hasNotIncluded ? false : true;

    //To clear data in validity when "Include In Data Extract" is unchecked
    if (index >= 0) {
      if (!this.addQuesForm.value.questions[index].isIncludeInDataExtract)
        this.addQuesForm.get('questions')['controls'][index].get('validityPeriod').patchValue('');
    }
    else {
      if (!this.editQuesForm.value.isIncludeInDataExtract)
        this.editQuesForm.get('validityPeriod').patchValue('');
    }
  }

  canDeactivate(component, route, state, next) {
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if (next.url.includes("/user/questionnaire/add") || next.url.includes("/user/questionnaire/edit") || next.url.includes("/login")) {
      // if(next.url && next.url.includes("preview-questionnaire") && !(this.data && this.data.questions && this.data.questions.length)) {
      //   // this.toastr.error('Select/Add at least one question from questions tab');
      //   this.toastr.error('Please select at least one question as mandatory');
      //   return;
      // }
      return this.checkTabChange(next.url);
    }
    else {
      return this.alertService.confirm();
    }
  }
}