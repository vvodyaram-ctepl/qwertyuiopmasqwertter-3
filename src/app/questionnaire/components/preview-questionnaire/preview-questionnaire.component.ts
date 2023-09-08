import { Component, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { QuestionnaireService } from '../../questionnaire.service';
import { Options } from 'sortablejs';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserDataService } from 'src/app/services/util/user-data.service';

@Component({
  selector: 'app-preview-questionnaire',
  templateUrl: './preview-questionnaire.component.html',
  styleUrls: ['./preview-questionnaire.component.scss', '../../styles/custom-slider.scss']
})
export class PreviewQuestionnaireComponent implements OnInit {

  data: any = {};
  editFlag: boolean = false;
  editId: any;
  saved: boolean = false;
  questionOptions: Options;
  instructionOptions: Options;
  modalRef: NgbModalRef;
  hasRadioOrDropdownQues: boolean = false;
  queryParams: any = {};

  constructor(
    private router: Router,
    private tabservice: TabserviceService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private questionnaireService: QuestionnaireService,
    private customDatePipe: CustomDateFormatPipe,
    private alertService: AlertService,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private userDataService: UserDataService
  ) {
    this.instructionOptions = {
      onUpdate: (event: any) => {
        this.data.instructions.forEach((inst, i) => {
          this.data.instructions[i].isUpdated = true;
        });
      }
    };
    this.questionOptions = {
      onUpdate: (event: any) => {
        if (!this.data.basicDetails.sections.length) {
          this.data.questions.forEach((ques, i) => {
            this.data.questions[i].isUpdated = true;
          });
        }
        else {
          this.data?.sectionWiseQuestions?.forEach((sectionWiseQuestion, i: number) => {
            let sectionName = this.data.basicDetails.sections[i]?.sectionName;
            this.data?.sectionWiseQuestions[i][sectionName]?.forEach((ques: any, j: number) => {
              this.data.sectionWiseQuestions[i][sectionName][j].isUpdated = true;
            });
          });
        }
      }
    };
  }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });

    //checking read-write permission
    let userProfileData = this.userDataService.getRoleDetails();

    userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
      if (ele.menuId == "26" && ele.menuActionId != "3") {
        this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
        return;
      }
    });

    this.data = this.tabservice.getModelData();
    if (this.router.url.includes("/user/questionnaire/edit")) {
      this.editFlag = true;
      this.editId = this.router.url.split('edit/')[1].split('/')[0];
    }
    if (!this.editFlag) {
      if (!this.data || !this.data.basicDetails) {
        this.router.navigate(['/user/questionnaire/add/basic-details'], { queryParams: this.queryParams });
        return;
      }
      else if (!this.data.questions.length) {
        this.router.navigate(['/user/questionnaire/add/add-questions'], { queryParams: this.queryParams });
        return;
      }
    }
    else {
      if (!this.data) {
        this.router.navigate([`/user/questionnaire/edit/${this.editId}/basic-details`], { queryParams: this.queryParams });
        return;
      }
    }

    // To show slider scale based on options
    this.data.questions.forEach((question: any, i: number) => {
      let options1: any = {};
      options1 = { ...question.other };
      options1.showTicks = !options1.isContinuousScale;
      options1.vertical = options1.isVerticalScale;
      options1.disabled = true;
      options1.getLegend = (value: number): string => {
        return value != options1.ceil ? '' + value : '';
      }
      this.data.questions[i].other1 = options1;
    });

    if (this.data.questions.length > 1) {
      this.hasRadioOrDropdownQues = this.data.questions.filter((question: any, i: number) => ((question.questionTypeId == 1 || question.questionTypeId == 2) && i != this.data.questions.length - 1)).length;
    }

    //If all sections removed after mapping in questions tab, remove selected section for all the questions
    if (!this.data.basicDetails.sections.length) {
      this.data.questions.forEach((question: any, i: number) => this.data.questions[i].section = null);
    }
    else {
      //check if any question is not mapped to section
      for (let i = 0; i < this.data.questions.length; i++) {
        let question = this.data.questions[i];
        if (!question.section?.sectionName) {
          this.toastr.error('Selecting section for a question is mandatory.');
          if (!this.editFlag) {
            this.router.navigate(['/user/questionnaire/add/add-questions'], { queryParams: this.queryParams });
          }
          else {
            this.router.navigate([`/user/questionnaire/edit/${this.editId}/add-questions`], { queryParams: this.queryParams });
          }
          return;
        }
        //check if any section is removed after mapping
        let hasSelectedSection = this.data.basicDetails.sections.filter((section: any) => section.sectionName == question.section.sectionName);
        if (!hasSelectedSection.length) {
          this.toastr.error(`${question.section.sectionName} was removed which is mapped for some questions. Please map to other section before submit.`);
          if (!this.editFlag) {
            this.router.navigate(['/user/questionnaire/add/add-questions'], { queryParams: this.queryParams });
          }
          else {
            this.router.navigate([`/user/questionnaire/edit/${this.editId}/add-questions`], { queryParams: this.queryParams });
          }
          return;
        }
      };

      //order questions based on sections
      let sectionWiseQuestions = [];
      this.data.basicDetails?.sections.forEach((section: any) => {
        let thisSectionQuestions = this.data.questions.filter((question: any) => question.section.sectionName == section.sectionName);
        sectionWiseQuestions = sectionWiseQuestions.concat({ [section.sectionName]: thisSectionQuestions });
      });
      this.data.sectionWiseQuestions = sectionWiseQuestions;
    }
  }

  // To show only the options that are selected for questions
  getQuestionOptions(questionOptions: any) {
    return questionOptions.filter((option: any) => option.isOption);
  }

  addQuestionnaire(hasSkipImplementation?: boolean) {
    this.spinner.show();

    //To send sectionWiseQuestions similar to questions (format)
    let sectionWiseQuestions: any[] = [];
    if (this.data.basicDetails.sections.length) {
      this.data?.sectionWiseQuestions?.forEach((sectionWiseQuestion, i: number) => {
        let sectionName = this.data.basicDetails.sections[i]?.sectionName;
        sectionWiseQuestions = sectionWiseQuestions.concat(this.data?.sectionWiseQuestions[i][sectionName]);
      });
    }

    let finalObj = {
      questionnaire: {
        ...this.data.basicDetails,
        instructions: this.data.instructions,
        questions: sectionWiseQuestions.length ? sectionWiseQuestions : this.data.questions
      }
    }

    let finalQuestions = [...finalObj.questionnaire.questions],
      filteredQuestions: any = []; // Filtered Questions is any array that is after removing options with isOption: false

    // To remove the option that has isOption as false
    finalQuestions.forEach((question: any) => {
      let filteredOptions = question.questionAnswerOptions.filter((opt: any) => opt.isOption);
      question.questionAnswerOptions = filteredOptions;
      filteredQuestions = [...filteredQuestions, question];
    });
    finalObj.questionnaire.questions = filteredQuestions;

    finalObj.questionnaire.startDate = this.customDatePipe.transform(finalObj.questionnaire.startDate, 'yyyy-MM-dd');
    finalObj.questionnaire.endDate = this.customDatePipe.transform(finalObj.questionnaire.endDate, 'yyyy-MM-dd');

    this.questionnaireService[!this.editFlag ? 'addQuestionnaire' : 'updateQuestionnaire']('/api/questionnaire', finalObj).subscribe(res => {
      if (res.status.success === true) {
        this.saved = true;
        let updatedOrAddedText = this.editFlag ? 'updated' : 'added';
        this.toastr.success(`Questionnaire ${updatedOrAddedText} successfully!`);
        if (hasSkipImplementation)
          this.router.navigate([`/user/questionnaire/skip-questions/${res.response.questionnaire.questionnaireId}`], { queryParams: this.queryParams });
        else
          this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    },
      err => {
        if (err.status == 500) {
          this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
        }
        else {
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        }
        this.spinner.hide();
      }
    );
  }

  publish() {
    this.data.basicDetails.isPublished = true;
    this.addQuestionnaire();
  }

  back() {
    if (!this.editFlag)
      this.router.navigate(['/user/questionnaire/add/add-questions'], { queryParams: this.queryParams });
    else
      this.router.navigate([`/user/questionnaire/edit/${this.editId}/add-questions`], { queryParams: this.queryParams });
  }

  getURL(file) {
    return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file[0]));
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

  canDeactivate(component, route, state, next) {
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if (next.url.includes("/user/questionnaire/add") || next.url.includes("/user/questionnaire/edit") || this.saved || next.url.includes("/login")) {
      return true;
    }
    else {
      return this.alertService.confirm();
    }
  }
}