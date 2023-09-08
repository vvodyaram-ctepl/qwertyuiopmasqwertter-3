import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { AssetService } from 'src/app/services/util/asset.service';
import { TabserviceService } from 'src/app/shared/tabservice.service';

@Component({
  selector: 'app-pet-asset',
  templateUrl: './pet-asset.component.html',
  styleUrls: ['./pet-asset.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PetAssetComponent implements OnInit {

  assetForm: FormGroup;
  editFlag: boolean = false;
  deviceArr: any = [];
  editId: string;
  submitFlag: boolean = false;
  assetTypeArr: any[] = [];
  assetModelArr: any[] = [];
  assetDeviceArr: any[] = [];
  addFilterFlag: boolean = true;
  displayStar: boolean = false;
  queryParams: any = {};
  currDate = moment().format("MM-DD-YYYY");;
  tabData: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private tabService: TabserviceService,
    private assetService: AssetService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private alertService: AlertService
  ) {

  }

  async ngOnInit() {
    this.assetForm = this.fb.group({
      arr: this.fb.array([this.createItem()])
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

    this.tabData = this.tabService.getModelData() || {};

    if (!this.tabData || (this.tabData && !this.tabData.petInfo)) {
      if (!this.editFlag)
        this.router.navigate(['/user/patients/add-patient/pet-info'], { queryParams: this.queryParams });
      else
        this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-info`], { queryParams: this.queryParams });
      return;
    }

    await this.getInitialData();

    if (Object.keys(this.tabData.petInfo).length > 0) {
      if (this.tabData.petInfo.status == '3' || this.tabData.petInfo.status == '4') {
        this.addFilterFlag = false;
      }
    }

    // data model starts
    let petDevicesData = this.tabData ? (this.tabData['petDevices'] ? this.tabData['petDevices'] : '') : '';
    let petDevices = petDevicesData ? petDevicesData.arr : [];

    //for intializing in edit/change tab
    if (petDevices) {
      petDevices.forEach((ele, i) => {
        this.assetTypeSelected(ele.assetType, i);
        this.assetForm.controls.arr['controls'][i].patchValue({
          "allocatedOn": ele.allocatedOn ? moment(ele.allocatedOn).format("MM-DD-YYYY") : '',
          "deviceNumber": ele.deviceNumber.deviceId ? ele.deviceNumber : '',
          "assetType": ele.assetType ? ele.assetType : '',
          "disabled": ele.disabled
        });
        this.assetModelSelected(ele.model, i);
        this.assetForm.controls.arr['controls'][i].patchValue({
          "model": ele.model ? ele.model : ''
        });

        if (i < (petDevices.length - 1)) {
          this.addItem();
        }
      })
    }
    //data model ends here
  }

  getInitialData(): Promise<any> {
    //Devices List
    this.spinner.show();
    return this.assetService.getDeviceDetails('/api/assets/getAllDevices', '').toPromise().then(resp => {
      this.deviceArr = resp.response.deviceInfos;

      this.deviceArr.forEach((device: any) => {
        let isTypeExist = this.assetTypeArr.filter(type => device.deviceType == type.name).length;
        if (!isTypeExist)
          this.assetTypeArr.push({ name: device.deviceType });
      });

      this.assetForm.controls.arr['controls'][0].patchValue({
        'assetTypeList': this.assetTypeArr
      });
      this.spinner.hide();
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
  }

  createItem() {
    return this.fb.group({
      'deviceNumber': ['', []],
      'assetType': [''],
      'model': [''],
      'allocatedOn': [''],
      'deviceList': [''],
      'assetModelList': [''],
      'assetTypeList': [''],
      'disabled': true
    });
  }

  addItem() {
    let arr = this.assetForm.get('arr') as FormArray;
    arr.push(this.createItem());
    arr['controls'][arr.value.length - 1].patchValue({
      'assetTypeList': this.assetTypeArr
    });
  }

  removeItem(i: number) {
    let arr = this.assetForm.get('arr') as FormArray;
    arr.removeAt(i);
  }

  assetTypeSelected($event, i) {
    // filter model list based on selected asset type
    if ($event) {
      this.assetModelArr = [];
      this.deviceArr.forEach((device: any) => {
        if (device.deviceModel && device.deviceType == $event.name) {
          let isModelExist = this.assetModelArr.filter(model => device.deviceModel == model.name).length;
          if (!isModelExist)
            this.assetModelArr.push({ name: device.deviceModel });
        }
      });
      this.assetForm.controls.arr['controls'][i].patchValue({
        'assetModelList': this.assetModelArr,
        'deviceList': '',
        'deviceNumber': ''
      });
    }
  }

  assetModelSelected($event, i) {
    // filter device number list based on selected asset model
    if ($event) {
      this.assetDeviceArr = [];
      this.deviceArr.forEach((device: any) => {
        if (device.deviceNumber && (device.deviceType == this.assetForm.value.arr[i].assetType.name) && (device.deviceModel == $event.name)) {
          let isDeviceExist = this.assetDeviceArr.filter(assetDevice => assetDevice.deviceId == device.deviceId).length;
          if (!isDeviceExist)
            this.assetDeviceArr.push(device);
        }
      });
      this.assetForm.controls.arr['controls'][i].patchValue({
        'deviceList': this.assetDeviceArr
      });
    }
  }

  onClearAssetType(i) {
    this.assetForm.controls.arr['controls'][i].patchValue({
      'assetModelList': '',
      'deviceList': '',
      'model': '',
      'deviceNumber': ''
    });
  }

  onClearModel(i) {
    this.assetForm.controls.arr['controls'][i].patchValue({
      'deviceList': '',
      'deviceNumber': ''
    });
  }

  back() {
    if (!this.editFlag) {
      this.router.navigate(['/user/patients/add-patient/pet-info'], { queryParams: this.queryParams });
    }
    else {
      this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-info`], { queryParams: this.queryParams });
    }
  }

  next() {
    if (this.checkTabChange()) {
      if (!this.editFlag) {
        this.router.navigate(['/user/patients/add-patient/pet-study'], { queryParams: this.queryParams });
      }
      else {
        this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-study`], { queryParams: this.queryParams });
      }
    }
  }

  checkTabChange() {
    this.assetForm.value.arr.forEach((ele: any, i: number) => {
      if (ele.allocatedOn) {
        this.assetForm.get('arr')['controls'][i].controls.deviceNumber.setValidators([Validators.required]);
        this.assetForm.get('arr')['controls'][i].controls.model.setValidators([Validators.required]);
        this.assetForm.get('arr')['controls'][i].controls.assetType.setValidators([Validators.required]);
        this.displayStar = true;

        this.assetForm.get('arr')['controls'][i].controls.deviceNumber.updateValueAndValidity();
        this.assetForm.get('arr')['controls'][i].controls.model.updateValueAndValidity();
        this.assetForm.get('arr')['controls'][i].controls.assetType.updateValueAndValidity();
      }
      if (ele.assetType) {
        this.assetForm.get('arr')['controls'][i].controls.deviceNumber.setValidators([Validators.required]);
        this.assetForm.get('arr')['controls'][i].controls.model.setValidators([Validators.required]);
        this.assetForm.get('arr')['controls'][i].controls.allocatedOn.setValidators([Validators.required]);
        this.displayStar = true;

        this.assetForm.get('arr')['controls'][i].controls.deviceNumber.updateValueAndValidity();
        this.assetForm.get('arr')['controls'][i].controls.model.updateValueAndValidity();
        this.assetForm.get('arr')['controls'][i].controls.allocatedOn.updateValueAndValidity();
      }
      if (ele.allocatedOn == '' && ele.assetType == '' && ele.model == '' && ele.deviceNumber == '') {
        this.assetForm.get('arr')['controls'][i].controls.assetType.setValidators([]);
        this.assetForm.get('arr')['controls'][i].controls.deviceNumber.setValidators([]);
        this.assetForm.get('arr')['controls'][i].controls.allocatedOn.setValidators([]);
        this.assetForm.get('arr')['controls'][i].controls.model.setValidators([]);
        this.displayStar = false;

        this.assetForm.get('arr')['controls'][i].controls.assetType.updateValueAndValidity();
        this.assetForm.get('arr')['controls'][i].controls.deviceNumber.updateValueAndValidity();
        this.assetForm.get('arr')['controls'][i].controls.allocatedOn.updateValueAndValidity();
        this.assetForm.get('arr')['controls'][i].controls.model.updateValueAndValidity();
      }
    });
    this.assetForm.markAllAsTouched();
    if (this.assetForm.valid) {
      let array = [];
      this.assetForm.value.arr.forEach((element: any) => {
        if (!(element.deviceNumber ? element.deviceNumber.deviceId == '' : element.deviceNumber == '')) {
          array.push(element);
        }
      });

      let dupAssets = [],
        uniqueAssets = array.filter((obj, index, self) => {
          if (
            index === self.findIndex((t) => (
              (t.deviceNumber.deviceId == obj.deviceNumber.deviceId) && (obj.deviceNumber != '' && t.deviceNumber != '')
            )))
            return obj;

          if (!dupAssets.includes(obj.deviceNumber.deviceNumber))
            dupAssets.push(obj.deviceNumber.deviceNumber)
        });

      if (uniqueAssets.length > 0 && uniqueAssets.length != array.length) {
        this.toastr.error(`Asset ${dupAssets.join(', ')} already associated with this pet. Please add a new asset number.`);
        return false;
      }

      this.submitFlag = true;
      let deviceObj = Object.assign({ arr: array });

      //To remove assets details which contains devices that are not present in pet device map
      let studyDeviceDetails = this.tabData.petStudyDevices ? this.tabData.petStudyDevices.arr : '';
      if (studyDeviceDetails) {
        for (let i = 0; i < studyDeviceDetails.length; i++) {
          let studyDeviceAssigned = studyDeviceDetails[i];
          let isAssetExist = array.filter(((petDevice: any) => petDevice.assetType.name == studyDeviceAssigned.assetType.name && petDevice.model.name == studyDeviceAssigned.model.name && petDevice.deviceNumber.deviceNumber == studyDeviceAssigned.deviceNumber.deviceNumber)).length;
          if (!isAssetExist) {
            studyDeviceDetails.splice(i, 1);
            --i;
          }
        }
      }
      let finalStudyDeviceAssignedDetails: any = {};
      finalStudyDeviceAssignedDetails['arr'] = studyDeviceDetails;
      this.tabService.setModelData(finalStudyDeviceAssignedDetails, 'petStudyDevices');

      this.tabService.setModelData(deviceObj, 'petDevices');
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
    if (next.url.indexOf('/add-patient/pet-info') > -1) {
      return true;
    }
    if (next.url.indexOf('/add-patient') > -1 || next.url.indexOf('/edit-patient') > -1) {
      if (this.assetForm) {
        if (!this.checkTabChange()) {
          this.submitFlag = false;
        }
      }
      else {
        return true;
      }
    }
    else {
      if (this.assetForm.pristine == false || Object.keys(this.tabData).length > 0) {
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
}
