import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PetService } from '../../pet.service';
import { ToastrService } from 'ngx-toastr';
import { ValidationService } from 'src/app/components/validation-message/validation.service';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { LookupService } from 'src/app/services/util/lookup.service';


@Component({
  selector: 'app-pet-parent-info',
  templateUrl: './pet-parent-info.component.html',
  styleUrls: ['./pet-parent-info.component.scss']
})
export class PetParentInfoComponent implements OnInit {
  recordtype: number = 1;
  headers: any;
  newPetheaders: any;
  dataArr: any[];
  petInfoForm: FormGroup;
  existingpetInfoForm: FormGroup;
  arr: FormArray;
  petParentArrList: any;
  existingPetParentArr: any[] = [];
  newPetParentArr: any[] = [];
  editFlag: boolean = false;
  editId: string;
  submitFlag: boolean = false;
  removedPetParents = [];
  addFilterFlag: boolean = true;
  internalStudy: boolean = true;
  queryParams: any = {};

  invalidResidentialAddress: boolean = false;
  invalidShippingAddress: boolean = false;

  isPetWithPetParent: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private tabservice: TabserviceService,
    private spinner: NgxSpinnerService,
    private petService: PetService,
    private lookupService: LookupService,
    private toastr: ToastrService,
    private alertService: AlertService,
    private route: ActivatedRoute
  ) {

  }

  ngOnInit() {

    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    })

    if (this.router.url.indexOf('/edit-patient') > -1) {
      let str = this.router.url;
      let id = str.split("edit-patient/")[1].split("/")[0];
      this.editFlag = true;
      this.editId = id;
    }

    this.existingpetInfoForm = this.fb.group({
      'petParent': ['', [Validators.required]],
    })

    this.petInfoForm = this.fb.group({
      'petParentFirstName': ['', [ValidationService.whiteSpaceValidator, ValidationService.exceptSpecialChar]],
      'petParentLastName': ['', [Validators.required, ValidationService.whiteSpaceValidator, ValidationService.exceptSpecialChar]],
      'ppEmail': ['', [Validators.required, ValidationService.emailValidator]],
      'phoneNumberCode': '',
      'phoneNumberValue': [''],
      'secondaryEmail': ['', [ValidationService.emailValidator]],
      'isNotifySecondaryEmail': [1],
      'residentialAddress': this.fb.group({
        'addressId': [],
        'address1': ['', [Validators.required]],
        'address2': [''],
        'city': ['', [Validators.required]],
        'state': ['', [Validators.required]],
        'country': ['', [Validators.required]],
        'zipCode': ['', [Validators.required, ValidationService.pinCodeValidator]],
        'timeZoneId': [],
        'timeZone': [],
        'addressType': 1
      }),
      'shippingAddress': this.fb.group({
        'addressId': [],
        'address1': [''],
        'address2': [''],
        'city': [''],
        'state': [''],
        'country': [''],
        'zipCode': ['', [ValidationService.pinCodeValidator]],
        'addressType': 2
      }),
      'isShipAddrSameAsResdntlAddr': [1]
    });
    this.spinner.show();
    this.petService.getPet('/api/petParents/getPetParents', '').subscribe(res => {
      this.petParentArrList = res.response.petParentList;
      this.spinner.hide();
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );

    this.headers = [
      { label: "Pet Parent Name", key: "petParentName", checked: true },
      { label: "Pet Parent Email", key: "petParentEmail", checked: true },
      { label: "Mobile", key: "phone", checked: true },
      { label: "Secondary Email", key: "secondaryEmail", checked: true },
      { label: "Pet Parent Address", key: "residentialAddress", checked: true },
      { label: "Shipping Address", key: "shippingAddress", checked: true },
      { label: "", checked: true, clickable: true, width: 85 },
    ];

    this.newPetheaders = [
      { label: "Pet Parent Name", key: "petParentName", checked: true },
      { label: "Pet Parent Email", key: "petParentEmail", checked: true },
      { label: "Mobile", key: "phone", checked: true },
      { label: "Secondary Email", key: "secondaryEmail", checked: true },
      { label: "Pet Parent Address", key: "residentialAddress", checked: true },
      { label: "Shipping Address", key: "shippingAddress", checked: true },
      { label: "", checked: true, clickable: true, width: 85 }
    ];

    let res = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
    if (!res || (res && !res.petInfo)) {
      if (!this.editFlag)
        this.router.navigate(['/user/patients/add-patient/pet-info'], { queryParams: this.queryParams });
      else
        this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-info`], { queryParams: this.queryParams });
      return;
    }

    this.isPetWithPetParent = res.petInfo.isPetWithPetParent;

    let existingArr = res ? (res['petExistingArr'] ? res['petExistingArr'] : '') : '';
    if (existingArr) {
      this.existingPetParentArr = existingArr;
    }
    let newArr = res ? (res['petNewArr'] ? res['petNewArr'] : '') : '';
    if (newArr) {
      this.newPetParentArr = newArr;
    }

    //setting status as on study
    let data = this.tabservice.getModelData();
    if (Object.keys(data.petInfo).length > 0) {
      if (data.petInfo.status == '3' || data.petInfo.status == '4') {
        this.addFilterFlag = false;
      }
    }
    //setting status as on study

    //checking Pet Study external or not
    if (data.petStudy) {
      if (Object.keys(data.petStudy).length > 0) {
        if (data.petStudy.arr[0].isExternal != 1) {
          this.internalStudy = true;
        }
        else {
          this.internalStudy = false;
        }
      }
    }
    //checking Pet Study external or not

  }

  phoneCodeChange() {
    if (this.petInfoForm.value.phoneNumberCode == '+1') {
      this.petInfoForm.controls['phoneNumberValue'].setValidators([ValidationService.usPhoneValidator]);
      this.petInfoForm.controls['phoneNumberValue'].updateValueAndValidity();
    }
    else {
      this.petInfoForm.controls['phoneNumberValue'].setValidators([ValidationService.ukPhoneValidator]);
      this.petInfoForm.controls['phoneNumberValue'].updateValueAndValidity();
    }
    this.petInfoForm.patchValue({
      'phoneNumberValue': ''
    })
  }

  deleteExPetArr(list) {
    this.existingPetParentArr.forEach((ele, i) => {
      if (list.ppId != undefined && list.ppId == ele.ppId) {
        this.existingPetParentArr.splice(i, 1);
        if (this.editFlag) {
          this.removedPetParents.push(ele.ppId);
        }
      }
    })
  }
  deleteNewPetArr(list) {
    this.newPetParentArr.forEach((ele, i) => {
      if (list.ppEmail != undefined && list.ppEmail == ele.ppEmail) {
        this.newPetParentArr.splice(i, 1);
      }
    })
  }
  editNewPet(list) {
    this.petInfoForm.patchValue({
      'petParentFirstName': list.petParentFirstName,
      'petParentLastName': list.petParentLastName,
      'ppEmail': list.ppEmail,
      'phoneNumberCode': list.phoneNumberCode,
      'phoneNumberValue': list.phoneNumberValue,
      'secondaryEmail': list.secondaryEmail,
      'isNotifySecondaryEmail': list.isNotifySecondaryEmail,
      'residentialAddress': list.residentialAddress,
      'shippingAddress': list.shippingAddress,
      'isShipAddrSameAsResdntlAddr': list.isShipAddrSameAsResdntlAddr
    })
  }
  newPetSubmit() {
    if (this.invalidResidentialAddress || this.invalidShippingAddress) {
      this.toastr.error('Enter a valid ' + (this.invalidResidentialAddress ? 'pet parent address' : 'shipping address'));
      return;
    }
    if (this.petInfoForm.value.phoneNumberValue == '(') {
      this.petInfoForm.patchValue({
        phoneNumberValue: ''
      })
    }
    if (this.petInfoForm.value.phoneNumberValue) {
      if (this.petInfoForm.value.phoneNumberCode == '+1') {
        this.petInfoForm.controls['phoneNumberValue'].setValidators([ValidationService.usPhoneValidator]);
        this.petInfoForm.controls['phoneNumberValue'].updateValueAndValidity();
      }
      else {
        this.petInfoForm.controls['phoneNumberValue'].setValidators([ValidationService.ukPhoneValidator]);
        this.petInfoForm.controls['phoneNumberValue'].updateValueAndValidity();
      }
    }
    else {
      this.petInfoForm.controls['phoneNumberValue'].setValidators([]);
      this.petInfoForm.controls['phoneNumberValue'].updateValueAndValidity();
    }
    this.petInfoForm.markAllAsTouched();
    if (this.petInfoForm.valid) {
      let newPetForm = this.petInfoForm.getRawValue();
      this.newPetParentArr.push({
        'petParentFirstName': newPetForm.petParentFirstName,
        'petParentLastName': newPetForm.petParentLastName,
        'ppEmail': newPetForm.ppEmail,
        'phoneNumberCode': newPetForm.phoneNumberCode,
        'phoneNumberValue': newPetForm.phoneNumberValue,
        'secondaryEmail': newPetForm.secondaryEmail,
        'isNotifySecondaryEmail': newPetForm.isNotifySecondaryEmail,
        'residentialAddress': newPetForm.residentialAddress,
        'shippingAddress': newPetForm.shippingAddress,
        'isShipAddrSameAsResdntlAddr': newPetForm.isShipAddrSameAsResdntlAddr ? 1 : 0
      });
      this.petInfoForm.patchValue({
        'petParentFirstName': '',
        'petParentLastName': '',
        'ppEmail': '',
        'phoneNumberCode': '+1',
        'phoneNumberValue': '',
        'secondaryEmail': '',
        'isNotifySecondaryEmail': 1,
        'residentialAddress': {
          'addressId': null,
          'address1': '',
          'address2': '',
          'city': '',
          'state': '',
          'country': '',
          'zipCode': '',
          'timeZoneId': '',
          'timeZone': '',
          'addressType': 1
        },
        'shippingAddress': {
          'addressId': null,
          'address1': '',
          'address2': '',
          'city': '',
          'state': '',
          'country': '',
          'zipCode': '',
          'addressType': 2
        },
        'isShipAddrSameAsResdntlAddr': 1,
      });
      this.petInfoForm.markAsUntouched();
    }
  }
  existingPetSubmit() {
    this.existingpetInfoForm.markAllAsTouched();
    if (this.existingpetInfoForm.valid) {
      let pParent = this.existingpetInfoForm.value.petParent;
      let duplicateRecord = false;
      //check for duplicates with the array list
      this.existingPetParentArr && this.existingPetParentArr.forEach(ele => {
        if (ele.ppId == pParent.petParentId) {
          duplicateRecord = true;
          this.toastr.error("Pet Parent" + " " + pParent.email + " " + "already mapped");
          this.existingpetInfoForm.patchValue({
            'petParent': ''
          })
          this.existingpetInfoForm.markAsUntouched();
        }
      })

      if (!duplicateRecord || this.existingPetParentArr.length == 0) {
        if (this.existingPetParentArr.length == 0) {
          this.existingPetParentArr = [];
        }

        //format mobile number
        let phoneNumber = pParent.phoneNumber;
        if (phoneNumber) {
          phoneNumber = phoneNumber.replace(/ /g, "");
          let desired = phoneNumber.replace(/[^\w\s]/gi, '');
          phoneNumber = desired;

          if (desired.startsWith("44")) {
            phoneNumber = this.formatUKPhoneNumber(phoneNumber);
          }
          else {
            phoneNumber = this.formatUSPhoneNumber(phoneNumber);
          }
          pParent.phoneNumber = phoneNumber;
        }
        this.existingPetParentArr.push({
          "phoneNumberValue": pParent.phoneNumber ? pParent.phoneNumber : '',
          "ppId": pParent.petParentId,
          // "ppName": pParent.petParentName,
          "petParentFirstName": pParent.petParentFirstName ? pParent.petParentFirstName : '',
          "petParentLastName": pParent.petParentLastName ? pParent.petParentLastName : '',
          "ppEmail": pParent.email ? pParent.email : '',
          "secondaryEmail": pParent.secondaryEmail ? pParent.secondaryEmail : '',
          "isNotifySecondaryEmail": pParent.isNotifySecondaryEmail,
          "residentialAddress": pParent.residentialAddressString,
          "shippingAddress": pParent.shippingAddressString,
          "isShipAddrSameAsResdntlAddr": pParent.isShipAddrSameAsResdntlAddr
        })


        this.existingpetInfoForm.patchValue({
          'petParent': ''
        })
        this.existingpetInfoForm.markAsUntouched();
      }


    }
  }
  createItem() {
    return this.fb.group({
      // 'ppName': '',
      'petParentFirstName': '',
      'petParentLastName': '',
      'ppEmail': ['', [Validators.required, ValidationService.emailValidator]],
      'phoneNumberCode': '',
      'phoneNumberValue': '',
      'secondaryEmail': ['', [ValidationService.emailValidator]],
      'isNotifySecondaryEmail': [1],
      'residentialAddress': this.fb.group({
        'addressId': [],
        'address1': ['', [Validators.required]],
        'address2': [''],
        'city': ['', [Validators.required]],
        'state': ['', [Validators.required]],
        'country': ['', [Validators.required]],
        'zipCode': ['', [Validators.required, ValidationService.pinCodeValidator]],
        'timeZoneId': [],
        'timeZone': [],
        'addressType': 1
      }),
      'shippingAddress': this.fb.group({
        'addressId': [],
        'address1': [''],
        'address2': [''],
        'city': [''],
        'state': [''],
        'country': [''],
        'zipCode': ['', [ValidationService.pinCodeValidator]],
        'addressType': 2
      }),
      'isShipAddrSameAsResdntlAddr': [1]
    })
  }

  addItem() {
    this.arr = this.petInfoForm.get('arr') as FormArray;
    this.arr.push(this.createItem());
  }

  removeItem(i: number) {
    this.arr = this.petInfoForm.get('arr') as FormArray;
    this.arr.removeAt(i);
  }
  ngAfterViewInit() {
    this.petInfoForm.patchValue({
      'phoneNumberCode': '+1'
    });
  }
  onSubmit($event) {

  }
  formatUSPhoneNumber(phoneNumberString) {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      var intlCode = (match[1] ? '+1 ' : '+1 ');
      return [intlCode, ' ', '(', match[2], ')', match[3], '-', match[4]].join('');
    }
    return null;
  }
  formatUKPhoneNumber(phoneNumber) {
    // let substring = phoneNumber.substring(0, 2);
    let phoneNumberArr = phoneNumber.toString().split(/44(.+)/);
    let genPh = phoneNumberArr[1]
    // return phoneNumberArr[1].replace(/\s+/g, '').replace(/(.)(\d{4})(\d)/, '+44 $1 - $2 - $3');
    let newString = '+44' + ' ' + genPh.substr(0, 2) + '-' + genPh.substr(2, 4) + '-' + genPh.substr(6, 4);
    return newString
  }
  checkDupEmail(emailControls: any) {
    if (this.petInfoForm.value.ppEmail && this.petInfoForm.value.secondaryEmail && this.petInfoForm.get('secondaryEmail').valid && this.petInfoForm.value.ppEmail.toUpperCase() === this.petInfoForm.value.secondaryEmail.toUpperCase()) {
      this.petInfoForm.get('secondaryEmail').setErrors({ invalidSecondaryEmail: true });
    }
    else {
      let errors = { ...this.petInfoForm.get('secondaryEmail').errors };
      if (errors.invalidSecondaryEmail) {
        delete errors.invalidSecondaryEmail;
        this.petInfoForm.get('secondaryEmail').setErrors({ ...errors });
        this.petInfoForm.get('secondaryEmail').updateValueAndValidity();
      }

      let newPetForm = this.petInfoForm.value;
      let duplicateRecord = false;
      this.newPetParentArr && this.newPetParentArr.forEach(ele => {
        if ((newPetForm.ppEmail && (ele.ppEmail == newPetForm.ppEmail || ele.secondaryEmail == newPetForm.ppEmail)) || (newPetForm.secondaryEmail && (ele.secondaryEmail == newPetForm.secondaryEmail || ele.ppEmail == newPetForm.secondaryEmail))) {
          duplicateRecord = true;
          let ppEmailDup: boolean = false;
          if (ele.ppEmail == newPetForm.ppEmail || ele.secondaryEmail == newPetForm.ppEmail)
            ppEmailDup = true;
          this.toastr.error("Pet Parent" + " " + (ppEmailDup ? newPetForm.ppEmail : newPetForm.secondaryEmail) + " " + "already mapped");
          emailControls.patchValue('');
          this.petInfoForm.markAsUntouched();
        }
      });

      if (duplicateRecord)
        return false;

      if (emailControls.valid && emailControls.value) {
        this.petService.isPetParentEmailExist(emailControls.value).subscribe(
          (res: any) => {
            if (res.response.isExist) {
              this.toastr.error(res.response.msg);
              emailControls.patchValue('');
            }
          },
          (err: any) => {
            this.spinner.hide();
            this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
          }
        );
      }
    }
  }
  onCheckShippingAddrss() {
    let arr = ['address1', 'address2', 'city', 'state', 'country', 'zipCode'];
    if (this.petInfoForm.value.isShipAddrSameAsResdntlAddr) {
      this.invalidShippingAddress = false;
      arr.forEach((ele) => {
        this.petInfoForm.get('shippingAddress').get(ele).reset();
        this.petInfoForm.get('shippingAddress').get(ele).clearValidators();
        this.petInfoForm.get('shippingAddress').get(ele).updateValueAndValidity();
      });
    }
    else {
      arr.forEach((ele) => {
        if (ele != 'address2' && ele != 'zipCode')
          this.petInfoForm.get('shippingAddress').get(ele).setValidators([Validators.required]);
        else if (ele == 'zipCode')
          this.petInfoForm.get('shippingAddress').get(ele).setValidators([Validators.required, ValidationService.pinCodeValidator]);
      });
    }
  }
  validateAddress(addressType: string) {
    if (addressType == 'shippingAddress')
      this.invalidShippingAddress = false;
    else
      this.invalidResidentialAddress = false;

    let petDetails = this.petInfoForm.value[addressType];
    if (petDetails.city && petDetails.state && petDetails.country && petDetails.zipCode && this.petInfoForm.get(addressType).get('zipCode').valid) {
      this.spinner.show();
      this.lookupService.validateAddress({ params: { address1: petDetails.address1, address2: petDetails.address2, city: petDetails.city, state: petDetails.state, country: petDetails.country, zipCode: petDetails.zipCode } }).subscribe((res) => {
        this.spinner.hide();
        if (res.response.isValidAddress) {
          this.petInfoForm.get(addressType).patchValue({ timeZoneId: res.response.address.timeZone.timeZoneId, timeZone: res.response.address.timeZone.timeZoneName });
        }
        else {
          if (addressType == 'shippingAddress')
            this.invalidShippingAddress = true;
          else
            this.invalidResidentialAddress = true;
          this.petInfoForm.get(addressType).patchValue({ timeZoneId: '', timeZone: '' });
        }
      },
        err => {
          this.spinner.hide();
          if (err.status == 400) {
            if (addressType == 'shippingAddress')
              this.invalidShippingAddress = true;
            else
              this.invalidResidentialAddress = true;
            this.petInfoForm.get(addressType).patchValue({ timeZoneId: '', timeZone: '' });
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
            return;
          }
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        }
      );
    }
  }
  selectPetParentAddress(parentTypeArr: string, index: number) {
    this.existingPetParentArr.forEach((existingParent: any) => existingParent.isPetWithPetParent = false);
    this.newPetParentArr.forEach((newParent: any) => newParent.isPetWithPetParent = false);
    this[parentTypeArr][index].isPetWithPetParent = true;
  }
  next() {

    let petParentArr = [];
    this.newPetParentArr && this.newPetParentArr.forEach(ele => {
      if (ele.phoneNumberValue == '') {
        ele.phoneNumberCode = '';
      }
    })
    petParentArr = (this.existingPetParentArr ? this.existingPetParentArr : []).concat(this.newPetParentArr ? this.newPetParentArr : []);
    this.tabservice.setModelData(this.removedPetParents, 'removedPetParents');
    this.tabservice.setModelData(this.existingPetParentArr, 'petExistingArr');
    this.tabservice.setModelData(this.newPetParentArr, 'petNewArr');
    let data = this.tabservice.getModelData();

    if (!this.editFlag) {
      this.router.navigate(['/user/patients/add-patient/review'], { queryParams: this.queryParams });
    }
    else {
      this.router.navigate([`/user/patients/edit-patient/${this.editId}/review`], { queryParams: this.queryParams });
    }
  }
  back() {

    if (!this.editFlag) {
      this.router.navigate(['/user/patients/add-patient/pet-study-asset'], { queryParams: this.queryParams });
    }
    else {
      this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-study-asset`], { queryParams: this.queryParams });
    }
  }
  canDeactivate(component, route, state, next) {
    let petParentArr = [];
    this.newPetParentArr && this.newPetParentArr.forEach(ele => {
      if (ele.phoneNumberValue == '') {
        ele.phoneNumberCode = '';
      }
    })
    petParentArr = (this.existingPetParentArr ? this.existingPetParentArr : []).concat(this.newPetParentArr ? this.newPetParentArr : []);
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if (next.url.indexOf('/add-patient') > -1 || next.url.indexOf('/edit-patient') > -1) {
      this.submitFlag = true;
      if (this.isPetWithPetParent) { //If pet with pet parent selected in pet info tab
        let isPetParentSelected = petParentArr.filter((parent: any) => parent.isPetWithPetParent);
        if (!isPetParentSelected.length) {
          this.toastr.error("Pet address or Pet Parent address is mandatory");
          return false;
        }
      }
      this.tabservice.setModelData(this.removedPetParents, 'removedPetParents');
      this.tabservice.setModelData(this.existingPetParentArr, 'petExistingArr');
      this.tabservice.setModelData(this.newPetParentArr, 'petNewArr');
    }
    else {
      let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
      if (petParentArr.length > 0 || Object.keys(data).length > 0) {
        return this.alertService.confirm();
      }
      else {
        return true
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
