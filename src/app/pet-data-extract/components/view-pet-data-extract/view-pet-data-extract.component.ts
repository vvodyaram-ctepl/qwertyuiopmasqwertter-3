import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PetDataExtractService } from '../../pet-data-extract.service';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { PetService } from 'src/app/patient/pet.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Component({
  selector: 'app-view-pet-data-extract',
  templateUrl: './view-pet-data-extract.component.html',
  styleUrls: ['./view-pet-data-extract.component.scss'],
  encapsulation : ViewEncapsulation.None
})
export class ViewPetDataExtractComponent implements OnInit {
  petId: any = '';
  viewFlag: boolean = false;
  arr: FormArray;
  petParentName: any = '';
  petDateOfBirth: any;
  petExtractDetails: any = {};
  existingPetArr: any = [];
  petDataExtractStreamsArr: any = [];
  headers: any;
  selectedPetIds: any = [];
  petStreamForm: FormGroup;
  tooltipHover = [true];

  @ViewChild('historyContent') historyContent: ElementRef;
  streamHistory: any = [];
  modalRef2: NgbModalRef;
  
  constructor(
    private toastr: ToastrService,
    private petDataExtractService: PetDataExtractService,
    private spinner: NgxSpinnerService,
    public customDatePipe: CustomDateFormatPipe,
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private petService: PetService,
    private modalService: NgbModal
  ) {

  }

  ngOnInit() {

    this.petStreamForm = this.fb.group({
      arr: this.fb.array([])
    });

    this.headers = [
      { key: "petType", label: "", width : '30px' },
      { key: "petName", label: "Pet Name",width :"70px" },
      { key: "studyId", label: "Stream" },
      { key: "studyName", label: "Study" },
      { key: "assetNumber", label: "Asset Number" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "ExtractStartDate", label: "Extract Start Date" },
      { key: "extractEndDate", label: "Extract End Date" },
      { key: "excludeFromDataExtract", label: "Exclude From Data Extract", width : '30px' }
    ]
    this.activatedRoute.params.subscribe(async params => {
      this.petId = params.id;
      this.spinner.show();
      this.petDataExtractService.getPet(`/api/petDataExtract/${this.petId}`).subscribe(res => {
        if (res.status.success === true) {
          this.petExtractDetails = res.response.petDataExtractStreamsDTO.petListDTO;
          this.petDateOfBirth = this.petExtractDetails.dateOfBirth ? this.customDatePipe.transform(this.petExtractDetails.dateOfBirth, 'MM-dd-yyyy') : '';
          this.petParentName = this.petExtractDetails.petParentName ? this.petExtractDetails.petParentName : '';

          if (params.type != 'view') {
            this.existingPetArr = res.response.petDataExtractStreamsDTO.petDataExtractStream;

            this.existingPetArr.forEach(element => {
              element.startDate = element.startDate ? this.customDatePipe.transform(element.startDate, 'MM-dd-yyyy') : '';
              element.endDate = element.endDate ? this.customDatePipe.transform(element.endDate, 'MM-dd-yyyy') : '';
            });

            this.existingPetArr.forEach(element => {
              const subFormArray = this.petStreamForm.get('arr') as FormArray;
              subFormArray.push(this.createSubFormGroup(element));
              this.spinner.hide();
            });
          }
          this.spinner.hide();
        }
        else {
          this.toastr.error(res.errors[0].message);
        }
      });
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      };

      if (params.type && params.type == 'view') {
        this.spinner.show();
        this.viewFlag = true;
        this.petDataExtractService.getPet(`/api/petDataExtract/getPetDataExtractConfigById/${this.petId}`).subscribe(res => {
          if (res.status.success === true) {
            this.existingPetArr = res.response;
          }
          else {
            this.toastr.error(res.errors[0].message);
          }
        });
      }
    });

  }
  createSubFormGroup(obj) {
    return this.fb.group({
      startDate: '',
      endDate: '',
      data: obj,
      isChecked : false
    })
  }
  submit() {
    let isDateValid: boolean = true;
    this.petStreamForm.value.arr.forEach(elem => {
      if ((elem.startDate == '' || elem.endDate == '') && !elem.isChecked) {
        isDateValid = false;
        return;
      }
    });
    if (!isDateValid) {
      this.toastr.error('Please select valid extract date');
      return;
    }

    let allexcludedextract = this.petStreamForm.value.arr.length > 1 ? this.petStreamForm.value.arr.every(v => v.isChecked === true) : false;
    if(allexcludedextract){
      this.toastr.error('At least one stream should be included in data extract.');
      return;
    }
   // console.log(this.petStreamForm.value.arr)

    let res = Object.assign({});
    let extractStreamList = [];

    let isOverlap: boolean = false;

    for (let i = 0; i < this.petStreamForm.value.arr.length; i++) {
      let overlapRecords = this.petStreamForm.value.arr.filter((obj: any, indx: number) => {
        
        if(obj.isChecked) return;
        let startDate1 = new Date(this.petStreamForm.value.arr[i].startDate),
          startDate2 = new Date(obj.startDate),
          endDate1 = new Date(this.petStreamForm.value.arr[i].endDate),
          endDate2 = new Date(obj.endDate);
        return ((i != indx && ((startDate1 >= startDate2 && startDate1 <= endDate2) || (endDate1 >= startDate2 && endDate1 <= endDate2) || (startDate2 >= startDate1 && startDate2 <= endDate1) || (endDate2 >= startDate1 && endDate2 <= endDate1))) && !obj.isChecked);
      });
      if (overlapRecords.length) {
        isOverlap = true;
        this.toastr.error("'Extract Date Ranges' should not overlap between streams.");
        return false;
      }
    }

    if (isOverlap)
      return false;

    this.petStreamForm.value.arr.forEach(element => {
      if (element.data.petType == 'P') {
        extractStreamList.push({
          "extractStartDate": element.startDate ? this.customDatePipe.transform(element.startDate, 'yyyy-MM-dd') : '',
          "extractEndDate": element.endDate ? this.customDatePipe.transform(element.endDate, 'yyyy-MM-dd') : '',
          "petId": this.petId,
          "streamId": element.data.streamId,
          "streamDeviceSequence": element.data.streamDeviceSeqNum,
          "excludeFromDataExtract" : element.isChecked ? 1 : 0,
          "duplicatePetId" :  ''
        });
      }else{
        extractStreamList.push({
          "extractStartDate": element.startDate ? this.customDatePipe.transform(element.startDate, 'yyyy-MM-dd') : '',
          "extractEndDate": element.endDate ? this.customDatePipe.transform(element.endDate, 'yyyy-MM-dd') : '',
          "petId": this.petId,
          "streamId": element.data.streamId,
          "streamDeviceSequence": element.data.streamDeviceSeqNum,
          "excludeFromDataExtract" : element.isChecked ? 1 : 0,
          "duplicatePetId" :  element.data.petId
        });
      }
    });
    res['extractStreamList'] = extractStreamList;
    res['petId'] = this.petId;
    //console.log(res);
    this.spinner.show();
    this.petDataExtractService.savePetExtractService('/api/petDataExtract', res).subscribe(res => {
      if (res.status.success === true) {
        this.toastr.success('Pet Data Extract Streams Dates added successfully!');
        this.spinner.hide();
        this.router.navigate(['/user/petDataExtract']);
      }
      else {
        this.toastr.error(res.errors[0].message);
        this.spinner.hide();
      }
    }, err => {
      console.log(err);
      this.errorMsg(err);
    });
  }
  errorMsg(err) {
    if (err.status == 500) {
      this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
    }
    else {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    }
    this.spinner.hide();
  }
  cancel() {
    this.router.navigate(['/user/petDataExtract']);
  }
  getHistory(list?: any){
    console.log(this.existingPetArr);
    this.streamHistory = [];
    this.existingPetArr.forEach(element => {
      if(element.excludeFromDataExtract == 0){
        this.streamHistory.push({
          assetNumber: element.assetNumber,
          startDate : element.extractStartDate,
          endDate : element.extractEndDate,
          stream: element.streamId
        })
      }
    });
    if(this.streamHistory.length){
      this.openPopup(this.historyContent, 'lg');
    }else{
      this.toastr.error("History unavailable as the selected stream is excluded from extract.");
    }
  }

  openPopup(div, size) {
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'xs' ? 'smallModal' : 'largeModal',
      backdrop: 'static',
      keyboard: false
    });
  }
  getFormatted(value){
    if(value)
    return moment(value).format("MM-DD-YYYY")
  }
  onHoverStream(i: number) {
    this.tooltipHover = [];
    this.tooltipHover[i] = !this.tooltipHover[i];
  }
  excludeDataExtract(event, index){
    if(event.target.checked){
        const form = this.petStreamForm.get('arr')['controls'][index];
        if(form){
          form.get('startDate').setValue('');
          form.get('endDate').setValue('');
        }
    }
  }
  
}

