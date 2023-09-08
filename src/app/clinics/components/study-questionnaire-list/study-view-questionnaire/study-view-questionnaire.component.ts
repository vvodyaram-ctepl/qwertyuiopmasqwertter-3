import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
 import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { environment } from 'src/environments/environment';
import { QuestionnaireService } from 'src/app/questionnaire/questionnaire.service';

@Component({
  selector: 'app-study-view-questionnaire',
  templateUrl: './study-view-questionnaire.component.html',
  styleUrls: ['./study-view-questionnaire.component.scss']
  //encapsulation: ViewEncapsulation.None
})
export class StudyViewQuestionnaireComponent implements OnInit {

  public data: any = {};
  public studyQuestionnaireId: any;
  public menuId: any;
  public isFav: boolean = false;
  modalRef: NgbModalRef;
  isEditPreDefined: boolean = true;

  private finalObject: any = {};

  isPublished: boolean = false; //Just to check if the user is trying to edit published questionnaire with the route known

  queryParams: any = {};
  studyId: any = '';

  public othersSpecifyText: string = this.toUpperAndTrim(environment.otherSpecifyText);
  selectedQuestions: any;
  addQuesForm: any;
  includeAll: boolean = false;
  editQuesForm: FormGroup;
  public questionsModel: any = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private questionnaireService: QuestionnaireService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private modalService: NgbModal,
    private alertService: AlertService
  ) {
  }

  ngOnInit(): void {

     // Form for predefined question edit
    this.editQuesForm = this.fb.group({
        dataExtract : this.fb.array([])
    });

    this.activatedRoute.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });


    this.spinner.show();
    this.activatedRoute.params.subscribe(params => {
      this.studyQuestionnaireId = params.id;
      this.studyId = params.studyId;
      this.questionnaireService.getQuestionnaireById(`/api/study/getQuestionnaireDtlsForDataExtractConfig/${this.studyQuestionnaireId}`).subscribe(res => {
        if (res.status.success === true) {

          this.data = res.response.questionnaire;
          this.isPublished = this.data.isPublished;

          //To show slider scale based on options and get next questions
          this.data.questions.forEach((question: any, i: number) => {
            this.questionsModel.push({ isIncludeInDataExtract : question.isIncludeInDataExtract , validityPeriod : question.validityPeriod});
            
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
          });

          //group questions based on sections
          this.data.sectionWiseQuestions = [];
          this.data.sections.forEach((section: any, sectionIndex: number) => {
            let thisSectionQuestions = this.data.questions.filter((question: any) => question.section.sectionName == section.sectionName);

            this.data.sectionWiseQuestions = this.data.sectionWiseQuestions.concat({ [section.sectionName]: thisSectionQuestions });

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

  }
 
  //For creating sections array if section based question and for creating questions array 
  createArray() {
    return this.fb.array([]);
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

  update() {
    let object=Object.assign({});
    object['studyQuestionnaireId'] = this.studyQuestionnaireId;
    let quesArr = this.editQuesForm.value.dataExtract
    this.data.questions.forEach((element,index) => {
        element['isIncludeInDataExtract'] = this.questionsModel[index].isIncludeInDataExtract;
        if(this.questionsModel[index].validityPeriod){
          element['validityPeriod'] = parseInt(this.questionsModel[index].validityPeriod);
        }else{
          element['validityPeriod'] = null;
        }
        
    });
    object['questions'] = this.data.questions;
    console.log(object)
   // return;

    this.spinner.show();
    this.questionnaireService.updateQuestionnaire('/api/study/updateDataExtractConfigStudyQuestionnaire', object).subscribe((res: any) => {
      if (res.status.success === true) {
        this.isPublished = true;
        this.toastr.success('Questionnaire updated successfully!');
        this.back();
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

  back() {
    this.router.navigate(['/user/clinics/study-questionnaire/'+ this.studyId]);
  }

  canDeactivate(component, route, state, next) {
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    return true;
  }

  //To check or uncheck "Include all questions in Data Extract"
  verifyisAllInclude(index?: number, event?: any) {
      console.log(this.questionsModel);
      if(!event.target.checked){
        this.questionsModel[index].validityPeriod = null; 
      }
  }
  
  createQuestion(): FormGroup {
    return this.fb.group({
      validityPeriod: ['', [Validators.pattern("^[0-9]*$"), Validators.min(1), Validators.max(999)]],
      isIncludeInDataExtract: [false]
    });
  }

  isIncludeAll(){
        this.questionsModel.forEach(element => {
          if (this.includeAll){
            element.isIncludeInDataExtract = true;
          }else{
            element.isIncludeInDataExtract = false;
          }
        });
  }

}