import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import * as moment from 'moment';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { AddUserService } from 'src/app/clinical-users/components/add-user.service';
import { PetService } from '../../pet.service';


@Component({
  selector: 'app-pet-study-asset',
  templateUrl: './pet-study-asset.component.html',
  styleUrls: ['./pet-study-asset.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PetStudyAssetComponent implements OnInit {
  deviceForm: FormGroup;
  unassignOrReplaceForm: FormGroup;
  modalRef2: NgbModalRef;
  editFlag: boolean = false;
  @ViewChild('unassignOrReplaceContent') unassignOrReplaceContent: ElementRef;
  @ViewChild('historyContent') historyContent: ElementRef;
  studyArr: any;
  isVirtual: boolean = false;
  deviceArr: any = [];
  editId: string;
  submitFlag: boolean = false;
  assetTypeArr: any;
  assetModelArr: any;
  removedAssetIds: any = [];
  formIndex: any;
  reasonArr: any;
  addFilterFlag: boolean = true;
  displayStar: boolean = false;
  queryParams: any = {};
  currentDate: any = moment().format("MM-DD-YYYY");;
  petDevicesArr: any[] = [];
  tabData: any;
  isReplace: boolean = false; // To differentiate b/w unassign and replace as using same popup for both of them
  streamHistory: any = [];

  tooltipHover = [true];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private tabservice: TabserviceService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private customDatePipe: CustomDateFormatPipe,
    private alertService: AlertService,
    private adduserservice: AddUserService,
    private petService: PetService
  ) {

  }

  ngOnInit() {
    this.deviceForm = this.fb.group({
      arr: this.fb.array([this.createItem()])
    });

    this.unassignOrReplaceForm = this.fb.group({
      'reason': ['', [Validators.required]],
      'deviceNumber': '',
      'model': '',
      'assignedOn': '',
      'time': [''],
      'unAssignedOn': ['', [Validators.required]],
      'dateOfDeath': [''],
      'isApproximateDateOfDeath': [false],
      'lostToFollowUpDate': [''],
      'isApproxLostToFollowUpDate': [false],
      'studiesMappedToSameDevice': this.fb.array([]), //Studies that are mapped to same devices
      'replacementAsset': this.fb.group({
        'assetType': [''],
        'assetModel': [''],
        'deviceNumber': [''],
        'assetTypeList': [this.assetTypeArr],
        'assetModelList': [''],
        'assetNumberList': ['']
      }), //For selecting the replacement device
      'replacedDeviceId': [''] //Used while replacing the device for a study
    });

    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    })

    if (this.router.url.indexOf('/edit-patient') > -1) {
      let str = this.router.url;
      let id = str.split("edit-patient/")[1].split("/")[0];
      this.editFlag = true;
      this.editId = id;
    }

    this.tabData = this.tabservice.getModelData() || {};
    if (!this.tabData || (this.tabData && !this.tabData.petInfo)) {
      if (!this.editFlag) {
        this.router.navigate(['/user/patients/add-patient/pet-info'], { queryParams: this.queryParams });
      }
      else {
        this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-info`], { queryParams: this.queryParams });
      }
      return;
    }
    else if (!(this.tabData.hasOwnProperty('petDevices') && this.tabData.petDevices.arr.length)) {
      this.toastr.error("Please allocate assets in the asset tab before navigating to the Data Streams tab.");
      if (this.editFlag) {
        this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-asset`], { queryParams: this.queryParams });
      }
      else {
        this.router.navigate(['/user/patients/add-patient/pet-asset'], { queryParams: this.queryParams });
      }
      return;
    }
    else if (!(this.tabData.hasOwnProperty('petStudy'))) {
      this.toastr.error("Please select study in the study tab before navigating to the Data Streams tab.");
      if (this.editFlag) {
        this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-study`], { queryParams: this.queryParams });
      }
      else {
        this.router.navigate(['/user/patients/add-patient/pet-study'], { queryParams: this.queryParams });
      }
      return;
    }

    // data model starts
    let petStudyDeviceData = this.tabData ? (this.tabData['petStudyDevices'] ? this.tabData['petStudyDevices'] : '') : '',
      petStudyDevices = petStudyDeviceData ? petStudyDeviceData.arr : [],
      petStudy = this.tabData ? (this.tabData['petStudy'] ? this.tabData['petStudy'] : '') : '',
      rest = petStudy ? petStudy.arr : '',
      petDevices = this.tabData ? (this.tabData['petDevices'] ? this.tabData['petDevices'] : '') : '';
    this.petDevicesArr = petDevices ? petDevices.arr : '';

    //Get selected studies
    let newArr = [];
    rest && rest.forEach(ele => {
      if (ele.studyName != '') {
        newArr.push({ "studyName": ele.studyName.studyName, "studyId": ele.studyName.studyId, "studyassDate": ele.studyassDate, "externalPet": ele.externalPet, "studyEndDate": ele.endDate })
      }
    })
    this.studyArr = newArr;

    //Get selected asset types
    this.assetTypeArr = [];
    this.petDevicesArr && this.petDevicesArr.forEach((petDevice: any) => {
      if (petDevice.assetType.name) {
        let isTypeExist = this.assetTypeArr.filter(type => type.name == petDevice.assetType.name);
        if (!isTypeExist.length)
          this.assetTypeArr.push(petDevice.assetType);
      }
    });
    this.deviceForm.controls.arr['controls'].forEach((elem, index) => {
      this.deviceForm.controls.arr['controls'][index].patchValue({
        'assetTypeList': this.assetTypeArr
      });
    });

    //Get unassigned reasons
    this.adduserservice.getStudy('/api/assets/getAssetUnAssignReason', '').subscribe(res => {
      this.reasonArr = res.response.unAssignReason;
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );

    //for intializing in edit/change tab
    if (petStudyDevices) {
      petStudyDevices.forEach((ele, i) => {
        this.assetTypeSelected(ele.assetType, i);
        this.assetModelSelected(ele.model, i);
        let isStudyExist: boolean = (this.studyArr.filter((study: any) => study.studyId == ele.study)).length;
        this.isVirtual = this.studyArr.length == 1 && (rest.filter((study: any) => study.isVirtual)).length;

        if (ele.replacedDeviceId)
          this.isReplace = true;

        this.deviceForm.controls.arr['controls'][i].patchValue({
          "assignedOn": ele.assignedOn ? moment(ele.assignedOn).format("MM-DD-YYYY") : '',
          "deviceNumber": ele.deviceNumber.deviceId ? ele.deviceNumber : '',
          "model": ele.model ? ele.model : '',
          "study": (ele.study && isStudyExist) ? ele.study : (this.isVirtual ? this.studyArr[0].studyId : ''),
          "studyName": (ele.studyName && isStudyExist) ? ele.studyName : (this.isVirtual ? this.studyArr[0].studyName : ''),
          'petStudyDeviceId': ele.petStudyDeviceId,
          'petStudyId': ele.petStudyId,
          'assetType': ele.assetType ? ele.assetType : '',
          'deviceList': ele.deviceList ? ele.deviceList : this.deviceArr,
          'unAssignedOn': ele.unAssignedOn,
          'unassignCheck': (ele.unAssignedOn && !ele.replacedDeviceId) ? true : false,
          'reasonId': ele.reasonId,
          'reasonValue': ele.reasonValue,
          'studyAssignedOn': (ele.studyName && isStudyExist) ? (ele.studyAssignedOn ? moment(ele.studyAssignedOn).format("MM-DD-YYYY") : '') : (this.isVirtual ? (this.studyArr[0].studyassDate ? moment(this.studyArr[0].studyassDate).format("MM-DD-YYYY") : '') : ''),
          'studyEndDate': ele.studyEndDate ? moment(ele.studyEndDate).format("MM-DD-YYYY") : '',
          'externalPetInfoId': ele.externalPetInfoId ? ele.externalPetInfoId : '',
          'disabled': ele.disabled,
          'dateOfDeath': ele.dateOfDeath,
          'isApproximateDateOfDeath': ele.isApproximateDateOfDeath,
          'lostToFollowUpDate': ele.lostToFollowUpDate,
          'isApproxLostToFollowUpDate': ele.isApproxLostToFollowUpDate,
          'replacedDeviceId': ele.replacedDeviceId,
          'replacedDeviceNumber': ele.replacedDeviceNumber,
          'streamId': ele.streamId
        });

        if (i < (petStudyDevices.length - 1)) {
          this.addItem();
        }
      });
    }
    //data model ends here

    //setting status as on study
    if (Object.keys(this.tabData.petInfo).length > 0) {
      if (this.tabData.petInfo.status == '3' || this.tabData.petInfo.status == '4') {
        this.addFilterFlag = false;
      }
    }
  }

  createStudiesMappedToDevices() {
    return this.fb.group({
      'petStudyDeviceId': [],
      'petStudyId': [],
      'studyName': [],
      'isChecked': []
    });
  }

  createItem() {
    return this.fb.group({
      'deviceNumber': ['', []],
      'assetType': [''],
      'model': [''],
      'study': ['', []],
      'studyName': [''],
      'assignedOn': [''],
      'petStudyDeviceId': [''],
      'petStudyId': [''],
      'deviceList': [''],
      'assetModelList': [''],
      'assetTypeList': [''],
      'unassignCheck': false,
      'reasonId': [''],
      'reasonValue': [''],
      'unAssignedOn': [''],
      'dateOfDeath': [''],
      'isApproximateDateOfDeath': [false],
      'lostToFollowUpDate': [''],
      'isApproxLostToFollowUpDate': [false],
      'externalPetInfoId': [''],
      'externalPetValue': [''],
      'studyAssignedOn': [''],
      'studyEndDate': [''],
      'disabled': true,
      'time': [''],
      'replacedDeviceId': [''],  //Used while replacing the device for a study
      'replacedDeviceNumber': [''],  //Used to show replaced device number in review tab
      'streamId': [''] //For getting the stream history
    });
  }

  addItem() {
    let arr = this.deviceForm.get('arr') as FormArray;
    arr.push(this.createItem());
    arr['controls'][arr.value.length - 1].patchValue({
      'assetTypeList': this.assetTypeArr
    });
  }

  onCheckboxChange(e, i) {
    if (e.target.checked == true) {
      // GET /assets/getAssetUnAssignReason
      this.isReplace = false;
      this.showUnassignOrReplace(this.unassignOrReplaceContent, 'xs', i);
    }
    else {
      this.resetUnassignOrReplace(i);
    }
  }

  resetUnassignOrReplace(i: number) {
    this.isReplace = false;
    this.deviceForm.controls.arr['controls'][i].patchValue({
      'unassignCheck': false,
      'reasonId': '',
      'time': '',
      'reasonValue': '',
      'unAssignedOn': '',
      'dateOfDeath': '',
      'isApproximateDateOfDeath': false,
      'lostToFollowUpDate': '',
      'isApproxLostToFollowUpDate': false,
      'replacedDeviceId': '',
      'replacedDeviceNumber': ''
    });
  }

  removeItem(i: number) {
    let arr = this.deviceForm.get('arr') as FormArray;
    arr.removeAt(i);
  }

  assetTypeSelected($event, i) {
    // filter device number list based on selected asset type
    if ($event) {
      this.assetModelArr = [];
      this.petDevicesArr && this.petDevicesArr.forEach((petDevice: any) => {
        if (petDevice.model.name && petDevice.assetType.name == $event.name) {
          let isModelExist = this.assetModelArr.filter(model => model.name == petDevice.model.name).length;
          if (!isModelExist)
            this.assetModelArr.push(petDevice.model);
        }
      });
      this.deviceForm.controls.arr['controls'][i].patchValue({
        'assetModelList': this.assetModelArr,
        'deviceList': '',
        'deviceNumber': ''
      });
    }
  }

  assetModelSelected($event, i) {
    // filter device number list based on selected asset model
    if ($event) {
      this.deviceArr = [];
      this.petDevicesArr.forEach((petDevice: any) => {
        if (petDevice.deviceNumber.deviceId && petDevice.model.name == $event.name) {
          let isDeviceExist = this.deviceArr.filter(device => device.deviceNumber.deviceId == petDevice.deviceNumber.deviceId).length;
          if (!isDeviceExist)
            this.deviceArr.push(petDevice.deviceNumber);
        }
      });
      this.deviceForm.controls.arr['controls'][i].patchValue({
        'deviceList': this.deviceArr
      });
    }
  }

  onSelectStudy($event, i) {
    this.studyArr.forEach(ele => {
      if (ele.studyId == $event.target.value) {
        this.deviceForm.controls.arr['controls'][i].patchValue({
          assignedOn: '',
          studyName: ele.studyName ? ele.studyName : '',
          externalPetInfoId: ele.externalPet ? ele.externalPet.externalPetId : '',
          externalPetValue: ele.externalPet ? ele.externalPet.externalPetValue : '',
          studyAssignedOn: ele.studyassDate ? ele.studyassDate : '',
          studyEndDate: ele.studyEndDate ? ele.studyEndDate : ''
        });
        this.displayStar = true;
      } else {
        this.displayStar = false;
      }
    });
  }

  onClearAssetType(i) {
    this.deviceForm.controls.arr['controls'][i].patchValue({
      'assetModelList': '',
      'deviceList': '',
      'model': '',
      'deviceNumber': ''
    });
  }

  onClearModel(i) {
    this.deviceForm.controls.arr['controls'][i].patchValue({
      'deviceList': '',
      'deviceNumber': ''
    });
  }

  showUnassignOrReplace(div, size, formIndex) {
    this.unassignOrReplaceForm.reset();
    let arr = this.unassignOrReplaceForm.get('studiesMappedToSameDevice') as FormArray;
    arr.clear();

    // To add studies that are having same devices to the array
    let studiesMappedToSameDevice = [];
    this.deviceForm.value.arr.forEach((ele: any, index: number) => {
      if ((!ele.unassignCheck && !ele.replacedDeviceId) && ele.petStudyDeviceId && ele.deviceNumber.deviceId == this.deviceForm.value.arr[formIndex].deviceNumber.deviceId && formIndex != index) {
        studiesMappedToSameDevice.push({ petStudyDeviceId: ele.petStudyDeviceId, studyName: ele.studyName, petStudyId: ele.petStudyId });
      }
    });
    studiesMappedToSameDevice?.forEach((ele: any, i: number) => {
      let arr = this.unassignOrReplaceForm.get('studiesMappedToSameDevice') as FormArray;
      arr.push(this.createStudiesMappedToDevices());
      arr['controls'][i].patchValue(ele);
    });

    if (this.isReplace) {
      this.unassignOrReplaceForm.get('replacementAsset').get('assetTypeList').patchValue(this.assetTypeArr);
      this.unassignOrReplaceForm.get('replacementAsset').get('assetType').setValidators([Validators.required]);
      this.unassignOrReplaceForm.get('replacementAsset').get('assetModel').setValidators([Validators.required]);
      this.unassignOrReplaceForm.get('replacementAsset').get('deviceNumber').setValidators([Validators.required]);
    }
    else {
      this.unassignOrReplaceForm.get('replacementAsset').get('assetType').clearValidators();
      this.unassignOrReplaceForm.get('replacementAsset').get('assetModel').clearValidators();
      this.unassignOrReplaceForm.get('replacementAsset').get('deviceNumber').clearValidators();
    }
    this.unassignOrReplaceForm.get('replacementAsset').get('assetType').updateValueAndValidity();
    this.unassignOrReplaceForm.get('replacementAsset').get('assetModel').updateValueAndValidity();
    this.unassignOrReplaceForm.get('replacementAsset').get('deviceNumber').updateValueAndValidity();

    this.formIndex = formIndex;
    this.openPopup(div, size);
  }

  openPopup(div, size) {
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'xs' ? 'smallModal' : 'largeModal',
      backdrop: 'static',
      keyboard: false
    });
  }

  unassignOrReplaceSubmit() {
    if (!this.unassignOrReplaceForm.valid) {
      this.unassignOrReplaceForm.markAllAsTouched();
      return false;
    }
    if (this.unassignOrReplaceForm.value.reason == '') {
      this.toastr.error("Please select a reason for unassigning");
      return false;
    }

    this.modalRef2.close();

    this.patchValuesOnUnassignOrReplace(this.formIndex);

    this.unassignOrReplaceForm.value.studiesMappedToSameDevice.forEach((studies: any) => {
      if (studies.isChecked) {
        this.deviceForm.value.arr.filter((ele: any, i: any) => {
          if (ele.petStudyDeviceId == studies.petStudyDeviceId) {
            this.patchValuesOnUnassignOrReplace(i);
          }
        })
      }
    });
  }

  patchValuesOnUnassignOrReplace(i: number) {
    let reasonId = this.unassignOrReplaceForm.value.reason;
    this.deviceForm.controls.arr['controls'][i].patchValue({
      'reasonId': reasonId.toString(),
      'time': this.unassignOrReplaceForm.value.time,
      'reasonValue': this.reasonArr.find(x => x.reasonId == reasonId),
      'unAssignedOn': this.customDatePipe.transform(this.unassignOrReplaceForm.value.unAssignedOn, 'yyyy-MM-dd'),
      'dateOfDeath': this.customDatePipe.transform(this.unassignOrReplaceForm.value.dateOfDeath, 'yyyy-MM-dd'),
      'isApproximateDateOfDeath': this.unassignOrReplaceForm.value.isApproximateDateOfDeath,
      'lostToFollowUpDate': this.customDatePipe.transform(this.unassignOrReplaceForm.value.lostToFollowUpDate, 'yyyy-MM-dd'),
      'isApproxLostToFollowUpDate': this.unassignOrReplaceForm.value.isApproxLostToFollowUpDate,
      'unassignCheck': !this.isReplace,
      'replacedDeviceId': this.unassignOrReplaceForm.value.replacementAsset.deviceNumber?.deviceId,
      'replacedDeviceNumber': this.unassignOrReplaceForm.value.replacementAsset.deviceNumber?.deviceNumber /* + '(' + this.unassignOrReplaceForm.value.replacementAsset.assetModel?.name + ')' */
    });
  }

  back() {
    if (!this.editFlag) {
      this.router.navigate(['/user/patients/add-patient/pet-study'], { queryParams: this.queryParams });
    }
    else {
      this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-study`], { queryParams: this.queryParams });
    }
  }

  next() {
    if (!this.editFlag) {
      this.router.navigate(['/user/patients/add-patient/pet-parent-info'], { queryParams: this.queryParams });
    }
    else {
      this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-parent-info`], { queryParams: this.queryParams });
    }
  }

  checkTabChange() {
    this.deviceForm.value.arr.forEach((ele: any, i: number) => {
      if (ele.study || ele.assignedOn || ele.assetType) {
        this.deviceForm.get('arr')['controls'][i].controls.study.setValidators([Validators.required]);
        this.deviceForm.get('arr')['controls'][i].controls.assetType.setValidators([Validators.required]);
        this.deviceForm.get('arr')['controls'][i].controls.model.setValidators([Validators.required]);
        this.deviceForm.get('arr')['controls'][i].controls.deviceNumber.setValidators([Validators.required]);
        this.deviceForm.get('arr')['controls'][i].controls.assignedOn.setValidators([Validators.required]);

        this.deviceForm.get('arr')['controls'][i].controls.study.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.assetType.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.model.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.deviceNumber.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.assignedOn.updateValueAndValidity();
        this.displayStar = true;
      }
      if (ele.assignedOn == '' && ele.study == '' && ele.assetType == '' && ele.model == '' && ele.deviceNumber == '') {
        this.deviceForm.get('arr')['controls'][i].controls.study.setValidators([]);
        this.deviceForm.get('arr')['controls'][i].controls.assetType.setValidators([]);
        this.deviceForm.get('arr')['controls'][i].controls.model.setValidators([]);
        this.deviceForm.get('arr')['controls'][i].controls.deviceNumber.setValidators([]);
        this.deviceForm.get('arr')['controls'][i].controls.assignedOn.setValidators([]);

        this.deviceForm.get('arr')['controls'][i].controls.study.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.assetType.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.model.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.deviceNumber.updateValueAndValidity();
        this.deviceForm.get('arr')['controls'][i].controls.assignedOn.updateValueAndValidity();
        this.displayStar = false;
      }

    });
    this.deviceForm.markAllAsTouched();
    if (this.deviceForm.valid) {
      let array = [];
      this.deviceForm.value.arr.forEach((element: any) => {
        if (!((element.study ? element.study == '' : element.study == '') && (element.deviceNumber ? element.deviceNumber.deviceId == '' : element.deviceNumber == ''))) {
          array.push(element);
        }
      });

      array.forEach((element) => {
        if ((element.unassignCheck == true || element.replacedDeviceId) && element.petStudyDeviceId != 0) {
          this.removedAssetIds.push({
            petStudyDeviceId: element.petStudyDeviceId,
            petStudyId: element.petStudyId,
            deviceId: element.deviceNumber.deviceId,
            reasonId: element.reasonId,
            unAssignedOn: element.unAssignedOn,
            reasonValue: this.reasonArr.find(x => x.reasonId == element.reasonId),
            dateOfDeath: element.dateOfDeath,
            isApproximateDateOfDeath: element.isApproximateDateOfDeath,
            lostToFollowUpDate: element.lostToFollowUpDate,
            isApproxLostToFollowUpDate: element.isApproxLostToFollowUpDate,
            replacedDeviceId: element.replacedDeviceId
          });
        }
      });

      let dups = [],
        unique = array.filter((obj, index, self) => {
          if (
            index === self.findIndex((t) => (
              t.study == obj.study && t.deviceNumber.deviceId == obj.deviceNumber.deviceId
            )))
            return obj;

          let dupObj = obj.studyName + '-' + obj.deviceNumber.deviceNumber;
          if (!dups.includes(dupObj))
            dups.push(dupObj)
        });

      if (unique.length && unique.length != array.length) {
        this.toastr.error(`Study  & Asset Number "${dups.join(', ')}" combination already exists. Please remove/change one of them.`);
        return false;
      }

      this.submitFlag = true;
      let deviceObj = Object.assign({ arr: array });

      if (this.removedAssetIds.length > 0 && this.editFlag) {
        deviceObj['removedAssetIds'] = this.removedAssetIds;
      }

      this.tabservice.setModelData(deviceObj, 'petStudyDevices');
      return true;
    }
    else {
      return false;
    }
  }

  canDeactivate(component, route, state, next) {
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if (next.url.indexOf('/add-patient/pet-info') > -1 || next.url.indexOf('/add-patient/pet-study') > -1) {
      return true;
    }
    if (next.url.indexOf('/add-patient') > -1 || next.url.indexOf('/edit-patient') > -1) {
      if (this.deviceForm) {
        if (!this.checkTabChange()) {
          this.submitFlag = false;
        }
      }
      else {
        return true;
      }
    }
    else {
      if (this.deviceForm.pristine == false || Object.keys(this.tabData).length > 0) {
        return this.alertService.confirm();
      }
      else {
        return true;
      }
    }

    if (!this.submitFlag) {
      return false;
    }
    else {
      return true;
    }
  }

  onReasonChange() {
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
  }

  assetTypeSelectedinReplace($event: any) {
    // filter model list based on selected asset type
    if ($event) {
      let assetModelArr = [];
      this.petDevicesArr && this.petDevicesArr.forEach((petDevice: any) => {
        if (petDevice.model.name && petDevice.assetType.name == $event.name) {
          let isModelExist = assetModelArr.filter(model => model.name == petDevice.model.name).length;
          if (!isModelExist && petDevice.deviceNumber.deviceId != this.deviceForm.value.arr[this.formIndex].deviceNumber.deviceId)
            assetModelArr.push(petDevice.model);
        }
      });
      this.unassignOrReplaceForm.get('replacementAsset').patchValue({
        'assetModelList': assetModelArr,
        'assetNumberList': '',
        'deviceNumber': ''
      });
    }
  }

  onClearAssetTypeinReplace() {
    this.unassignOrReplaceForm.get('replacementAsset').patchValue({
      'assetModelList': '',
      'assetNumberList': '',
      'assetModel': '',
      'deviceNumber': ''
    });
  }

  assetModelSelectedinReplace($event: any) {
    // filter device number list based on selected asset model
    if ($event) {
      this.deviceArr = [];
      this.petDevicesArr.forEach((petDevice: any) => {
        if (petDevice.deviceNumber.deviceId && petDevice.model.name == $event.name) {
          let isDeviceExist = this.deviceArr.filter(device => device.deviceNumber.deviceId == petDevice.deviceNumber.deviceId).length;
          let isExistInOtherMappings = this.deviceForm.value.arr.filter((studyDevice: any) => {
            return petDevice.deviceNumber.deviceId == studyDevice.deviceNumber.deviceId && this.deviceForm.value.arr[this.formIndex].study == studyDevice.study
          }).length;
          if (!isDeviceExist && !isExistInOtherMappings)
            this.deviceArr.push(petDevice.deviceNumber);
        }
      });
      this.unassignOrReplaceForm.get('replacementAsset').patchValue({
        'assetNumberList': this.deviceArr
      });
    }
  }

  onClearAssetModelinReplace() {
    this.unassignOrReplaceForm.get('replacementAsset').patchValue({
      'assetNumberList': '',
      'deviceNumber': ''
    });
  }

  checkStudyAndDeviceNumbersExist(event: any, i: number) {
    if (this.isReplace) {
      if (event.target.checked) {
        if (!this.unassignOrReplaceForm.value.replacementAsset.deviceNumber || !this.unassignOrReplaceForm.value.replacementAsset.deviceNumber.deviceId) {
          this.unassignOrReplaceForm.get('studiesMappedToSameDevice')['controls'][i].patchValue({ isChecked: false });
          this.toastr.error('Please select the asset before selecting the study');
          return false;
        }
        let petStudyId = this.unassignOrReplaceForm.value.studiesMappedToSameDevice[i].petStudyId,
          studyName = this.unassignOrReplaceForm.value.studiesMappedToSameDevice[i].studyName,
          deviceSelected = this.unassignOrReplaceForm.value.replacementAsset.deviceNumber.deviceId,
          deviceNameSelected = this.unassignOrReplaceForm.value.replacementAsset.deviceNumber.deviceNumber,
          isStudyDeviceAlreadyExist = this.deviceForm.value.arr.filter((studyDevice: any) => studyDevice.petStudyId == petStudyId && studyDevice.deviceNumber.deviceId == deviceSelected).length;
        if (isStudyDeviceAlreadyExist) {
          this.toastr.error(`${studyName} and ${deviceNameSelected} combination already exists`);
          this.unassignOrReplaceForm.get('studiesMappedToSameDevice')['controls'][i].patchValue({ isChecked: false });
        }
      }
    }
  }

  getHistory(i: number) {
    this.spinner.show();
    //Get stream history
    this.petService.getStreamHistory(this.deviceForm.value.arr[i].petStudyId, this.deviceForm.value.arr[i].streamId).subscribe((res: any) => {
      this.streamHistory = res.response.rows;
      if (this.streamHistory.length)
        this.openPopup(this.historyContent, 'lg');
      else {
        this.toastr.error('No stream history found!');
      }
      this.spinner.hide();
    },
      (err: any) => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
        this.spinner.hide();
      }
    );
  }

  onHoverStream(i: number) {
    this.tooltipHover = [];
    this.tooltipHover[i] = !this.tooltipHover[i];
  }
}
