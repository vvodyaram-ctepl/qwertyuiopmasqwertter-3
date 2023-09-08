import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { PetService } from '../../pet.service';

@Component({
  selector: 'app-asset-unassign',
  templateUrl: './asset-unassign.component.html',
  styleUrls: ['./asset-unassign.component.scss']
})
export class AssetUnassignComponent implements OnInit {

  @ViewChild('unassignOrReplaceContent') openAttachmentDiv: ElementRef;
  unassignOrReplaceForm: FormGroup;
  modalRef: NgbModalRef;
  closeResult: string;
  assetTypeArr: any;
  reasonArr: any;
  @Output() dismiss = new EventEmitter();
  @Input() deviceId: string = '';
  @Input() studiesMappedToSameDevice: any = [];
  @Input() fromPage: string = '';
  @Input() studyId: any = '';
  @Input() petId: any = '';

  constructor(private fb: FormBuilder,private modalService: NgbModal,
    private petService: PetService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private customDatepipe: CustomDateFormatPipe) { }

  ngOnInit(): void {
    
    this.unassignOrReplaceForm = this.fb.group({
      'reason': ['', [Validators.required]],
      'deviceId': '',
      'model': '',
      'time': [''],
      'unAssignedOn': ['', [Validators.required]],
      'dateOfDeath': [''],
      'isApproximateDateOfDeath': [false],
      'lostToFollowUpDate': [''],
      'isApproxLostToFollowUpDate': [false],
      'studiesMappedToSameDevice': this.fb.array([]), //Studies that are mapped to same devices
    });
    
    this.petService.getAssetUnAssignReason('/api/assets/getAssetUnAssignReason', '').subscribe(res => {
      this.reasonArr = res.response.unAssignReason;
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
    this.unassignOrReplaceForm.patchValue({ 'deviceId' : this.deviceId});
    console.log(this.studiesMappedToSameDevice)
    
    this.getPetStudiesByDevice();

  }

  getPetStudies(){
    this.spinner.show();
      this.studiesMappedToSameDevice = [];
      this.petService.getPetDevices(`/api/pets/${this.petId}/getPetDevices`, '').subscribe(res => {
        this.spinner.hide();
        if(res.response && res.response.rows.length){
          res.response.rows.forEach((ele: any) => {
            if (ele.studyId !=  this.studyId 
              && ele.deviceId != '' 
              && this.deviceId == ele.deviceId) {
              this.studiesMappedToSameDevice.push({
                petStudyDeviceId: ele.petStudyDeviceId, 
                studyName: ele.studyName, 
                petStudyId: ele.petStudyId ,
                studyId : ele.studyId
              });
            }
          });
         
          if(this.studiesMappedToSameDevice.length){
            this.studiesMappedToSameDevice.forEach((ele,i) => {
              let arr = this.unassignOrReplaceForm.get('studiesMappedToSameDevice') as FormArray;
              arr.push(this.createStudiesMappedToDevices());
              arr['controls'][i].patchValue(ele);
            });
          }
        }
      },
        err => {
          this.errorMsg(err);
        });
  }

  getPetStudiesByDevice(){
    this.spinner.show();
      this.studiesMappedToSameDevice = [];
      let url = '/api/assets/getPetStudiesByAsset/'+this.deviceId;
      console.log(url)
      
      this.petService.getPetDevices(url, '').subscribe(res => {
        this.spinner.hide();
        if(res.response && res.response.rows.length){
          res.response.rows.forEach((ele: any) => {
            if (ele.studyId !=  this.studyId 
              && ele.deviceId != '' 
              && this.deviceId == ele.deviceId) {
              this.studiesMappedToSameDevice.push({
                petStudyDeviceId: ele.petStudyDeviceId, 
                studyName: ele.studyName, 
                petStudyId: ele.petStudyId ,
                studyId : ele.studyId
              });
            }
          });
         
          if(this.studiesMappedToSameDevice.length){
            this.studiesMappedToSameDevice.forEach((ele,i) => {
              let arr = this.unassignOrReplaceForm.get('studiesMappedToSameDevice') as FormArray;
              arr.push(this.createStudiesMappedToDevices());
              arr['controls'][i].patchValue(ele);
            });
          }
        }
      },
        err => {
          this.errorMsg(err);
        });
  }

  resetUnassignForm() {
   
    this.unassignOrReplaceForm.patchValue({
      'unassignCheck': false,
      'reasonId': '',
      'reason' : '',
      'time': '',
      'reasonValue': '',
      'unAssignedOn': '',
      'dateOfDeath': '',
      'isApproximateDateOfDeath': false,
      'lostToFollowUpDate': '',
      'isApproxLostToFollowUpDate': false,
      'studiesMappedToSameDevice': this.fb.array([])
    });
    
  }
 
  getDismissReason(reason: any) {
    console.log(reason);
  }
  createStudiesMappedToDevices() {
    return this.fb.group({
      'petStudyDeviceId': [],
      'petStudyId': [],
      'studyName': [],
      'isChecked': [],
      'studyId' : ''
    });
  }

  onReasonChange() {
      
    this.unassignOrReplaceForm.patchValue({ dateOfDeath : '', lostToFollowUpDate : '', isApproxLostToFollowUpDate : '', isApproximateDateOfDeath : ''});

    if (this.unassignOrReplaceForm.value.reason == 5) {
      this.unassignOrReplaceForm.get('dateOfDeath').setValidators([Validators.required]);
      this.unassignOrReplaceForm.get('lostToFollowUpDate').clearValidators();
    }
    else {
      if (this.unassignOrReplaceForm.value.reason == 4) {
        this.unassignOrReplaceForm.get('lostToFollowUpDate').setValidators([Validators.required]);
      }
      else {
        this.unassignOrReplaceForm.get('lostToFollowUpDate').clearValidators();
      }
      this.unassignOrReplaceForm.get('dateOfDeath').clearValidators();
    }
    this.unassignOrReplaceForm.get('dateOfDeath').updateValueAndValidity();
    this.unassignOrReplaceForm.get('lostToFollowUpDate').updateValueAndValidity();
    
    this.unassignOrReplaceForm.markAsUntouched();

  }
  submit(){
    if (!this.unassignOrReplaceForm.valid) {
      this.unassignOrReplaceForm.markAllAsTouched();
      return false;
    }
    if (this.unassignOrReplaceForm.value.reason == '') {
      this.toastr.error("Please select a reason for unassigning");
      return false;
    }
    
    let array = [];
    let request = Object.assign({});
    console.log(this.unassignOrReplaceForm.value);
     
    request['reasonId'] = this.unassignOrReplaceForm.value.reason;
    request['studyId'] = this.studyId;
    request['deviceId'] = this.unassignOrReplaceForm.value.deviceId;
   
    request['dateOfDeath'] = this.customDatepipe.transform(this.unassignOrReplaceForm.value.dateOfDeath, 'yyyy-MM-dd');
    request['lostToFollowUpDate'] = this.customDatepipe.transform(this.unassignOrReplaceForm.value.lostToFollowUpDate, 'yyyy-MM-dd');
    
    request['isApproxLostToFollowUpDate'] = this.unassignOrReplaceForm.value.isApproxLostToFollowUpDate ? 1 : 0;
    request['isApproximateDateOfDeath'] = this.unassignOrReplaceForm.value.isApproximateDateOfDeath ? 1 : 0;
    request['unAssignedOn'] = this.customDatepipe.transform(this.unassignOrReplaceForm.value.unAssignedOn, 'yyyy-MM-dd');

    array.push(request);

    this.unassignOrReplaceForm.value.studiesMappedToSameDevice.forEach(element => {

        if(element.isChecked){
          let obj = Object.assign({});
        
          obj['reasonId'] = this.unassignOrReplaceForm.value.reason;
          obj['studyId'] = element.studyId;
          obj['deviceId'] = this.unassignOrReplaceForm.value.deviceId;
           
          obj['dateOfDeath'] = this.customDatepipe.transform(this.unassignOrReplaceForm.value.dateOfDeath, 'yyyy-MM-dd');
          obj['lostToFollowUpDate'] = this.customDatepipe.transform(this.unassignOrReplaceForm.value.lostToFollowUpDate, 'yyyy-MM-dd');
          obj['isApproxLostToFollowUpDate'] = this.unassignOrReplaceForm.value.isApproxLostToFollowUpDate ? 1 : 0;
          obj['isApproximateDateOfDeath'] = this.unassignOrReplaceForm.value.isApproximateDateOfDeath ? 1 : 0;
          obj['unAssignedOn'] = this.customDatepipe.transform(this.unassignOrReplaceForm.value.unAssignedOn, 'yyyy-MM-dd');
          
          array.push(obj);
        }
        
    });

    let finalObj = Object.assign({});
    finalObj['petUnAssignAssets'] = array;

    console.log(finalObj);

    this.spinner.show();
    this.petService.unassignAsset('/api/assets/unassignAsset',finalObj).subscribe((res: any) => {
      this.spinner.hide();
      this.toastr.success("Asset unassigned successfully");
      this.dismiss.emit('Asset unassigned successfully');
    },
      (err: any) => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
        this.spinner.hide();
      }
    );

  }

  errorMsg(err) {
    if (err.status == 500) {
      this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
    }
    else if(err.status == 400){
      this.toastr.warning(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    }else{
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    }
    this.spinner.hide();
  }

  d(val){
    this.dismiss.emit(val);
  }
}
