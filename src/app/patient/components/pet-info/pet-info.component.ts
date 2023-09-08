import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { PetService } from '../../pet.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { ValidationService } from 'src/app/components/validation-message/validation.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LookupService } from 'src/app/services/util/lookup.service';

@Component({
  selector: 'app-pet-info',
  templateUrl: './pet-info.component.html',
  styleUrls: ['./pet-info.component.scss']
})
export class PetInfoComponent implements OnInit {
  @ViewChild('archiveContent') archiveContent: ElementRef;
  petInfoForm: FormGroup;
  breedArr: any;
  statusArr: any[] = [];
  startDate: any;
  submitFlag: boolean;
  editFlag: boolean = false;
  editId: string;
  modalRef2: NgbModalRef;
  studyArr: any;
  speciesArr: any;
  formDataCopy: any;
  newAArr: any[];
  isVirtual: boolean = false;
  queryParams: any = {};

  invalidAddress: boolean = false;
  petInfo: any;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private tabservice: TabserviceService,
    private petService: PetService,
    private lookupService: LookupService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private customDatePipe: CustomDateFormatPipe,
    private alertService: AlertService,
    private modalService: NgbModal
  ) {

    this.petInfoForm = this.fb.group({
      'petImage': [''],
      'petImageUrl': [''],
      'petImageFileName': [''],
      'petName': ['', [Validators.required, ValidationService.whiteSpaceValidator, ValidationService.exceptSpecialChar]],
      'dateofBirth': [''],
      'isDobUnknown': [false],
      'breed': ['', [Validators.required]],
      'species': ['', [Validators.required]],
      'speciesName': [''],
      'weightUnits': '',
      // 'weight': ['', [ValidationService.decimalValidatorWithValue]],
      'status': ['', [Validators.required]],
      'gender': [''],
      'category': [''],
      'confirmOffStudy': false,
      'petPreviousStatus': [''],
      'statusDisable': false,
      'dateOfDeath': [''],
      'isApproximateDateOfDeath': [false],
      'lostToFollowUpDate': [''],
      'isApproxLostToFollowUpDate': [false],
      'isPetWithPetParent': [1],
      'petAddress': this.fb.group({
        'addressId': [],
        'address1': [''],
        'address2': [''],
        'city': [''],
        'state': [''],
        'country': [''],
        'zipCode': ['', [ValidationService.pinCodeValidator]],
        'timeZoneId': [],
        'timeZone': [],
        'addressType': 1
      })
    });

  }

  ngAfterViewInit() {


    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    })

    this.tabservice.dataModel$.subscribe(res => {
      let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {};
      if (!(data.hasOwnProperty('petInfo'))) {
        this.petInfoForm.patchValue({
          'status': 1,
          'weightUnits': 'LBS',
        });
      }
      else {
        res = res ? (res['petInfo'] ? res['petInfo'] : '') : '';
        this.petInfoForm?.patchValue({
          //'petImage': res.petImage ? res.petImage :'',
          'petImageUrl': res.petImageUrl ? res.petImageUrl : '',
          'petImageFileName': res.petImageFileName ? res.petImageFileName : '',
          'petName': res.petName ? res.petName : '',
          'dateofBirth': res.dateofBirth ? (this.customDatePipe.transform(res.dateofBirth, 'MM-dd-yyyy')) : '',
          'isDobUnknown': res.isDobUnknown,
          'breed': { "breedName": res.breed ? res.breed.breedName : '', "breedId": res.breed ? res.breed.breedId : '' },
          'weightUnits': res.weightUnits ? res.weightUnits : '',
          'weight': res.weight ? res.weight : '',
          'status': res.status ? res.status : '',
          'gender': res.gender ? res.gender : '',
          'category': res.category ? res.category : '',
          'speciesName': res.speciesName ? res.speciesName : '',
          'species': res.species ? res.species : '',
          'petPreviousStatus': res.petPreviousStatus ? res.petPreviousStatus : '',
          'statusDisable': res.statusDisable ? res.statusDisable : '',
          'dateOfDeath': res.dateOfDeath ? (this.customDatePipe.transform(res.dateOfDeath, 'MM-dd-yyyy')) : '',
          'isApproximateDateOfDeath': res.isApproximateDateOfDeath,
          'lostToFollowUpDate': res.lostToFollowUpDate ? (this.customDatePipe.transform(res.lostToFollowUpDate, 'MM-dd-yyyy')) : '',
          'isApproxLostToFollowUpDate': res.isApproxLostToFollowUpDate,
          'isPetWithPetParent': res.isPetWithPetParent,
          'petAddress': res.petAddress
        });
        this.onCheckIsPetWithPetParent();
      }
    });

    this.formDataCopy = JSON.parse(JSON.stringify(this.petInfoForm.value));

  }

  private async getStudy() {
    this.spinner.show();
    let res: any = await (
      this.petService.getPet('/api/study/getStudyList', '').pipe(
        catchError(err => {
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.!');
          return of(false);
        })
      )
    ).toPromise();
    if (res.status.success === true) {
      this.studyArr = res.response.studyList;
      this.spinner.hide();
    }
  }

  private async getSpecies() {
    this.spinner.show();
    let res: any = await (
      this.petService.getPet('/api/lookup/getPetSpecies', '').pipe(
        catchError(err => {
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.!');
          return of(false);
        })
      )
    ).toPromise();
    if (res.status.success === true) {
      this.speciesArr = res.response.species;
      this.spinner.hide();
    }
  }

  breedSelected($event) {
    this.petInfoForm.patchValue({
      "species": $event.speciesId ? $event.speciesId : ''
    })
    let speciArr: any = [];
    let speciesId = this.petInfoForm.value.species;
    if (this.speciesArr) {
      speciArr = this.speciesArr.filter(ele => ele.speciesId == speciesId);
    }
    this.petInfoForm.patchValue({
      "speciesName": speciArr[0] ? (speciArr[0].speciesName ? speciArr[0].speciesName : '') : ''
    })
  }

  getInitialData() {
    this.petService.getPet('/api/lookup/getPetStatuses', '').subscribe(res => {
      this.statusArr = res.response.petStatuses;

      // If add pet, remove deceased and lost to follow up
      if (!this.editFlag) {
        this.statusArr.splice(2, 2);
      }
      this.spinner.hide();
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
  }

  async ngOnInit() {
    this.startDate = moment().format("MM-DD-YYYY");
    this.spinner.show();
    this.petService.getPet('/api/lookup/getPetBreeds', '').subscribe(res => {
      this.breedArr = res.response.breeds;
      this.newAArr = this.breedArr;
      this.spinner.hide();
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
    await this.getSpecies();

    //check for edit and view
    if (this.router.url.indexOf('/edit-patient') > -1) {
      let str = this.router.url;
      let id = str.split("edit-patient/")[1].split("/")[0];
      this.editFlag = true;
      this.editId = id;
      this.spinner.show();
      let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
      if (Object.keys(data).length == 0 || !data.petInfo) {
        await this.getStudy();
        await this.getSpecies();
        this.petService.getPet(`/api/pets/${id}`, '').subscribe(res => {
          if (res.status.success == true) {
            let petDetails = res.response.petDTO;
            this.petInfo = res.response.petDTO;

            let editData1 = Object.assign({});
            editData1["petImage"] = petDetails.photoName ? petDetails.photoName : '';
            editData1["petImageFileName"] = petDetails.photoName ? petDetails.photoName : '';
            editData1["petImageUrl"] = petDetails.petPhotoUrl ? petDetails.petPhotoUrl : '';
            editData1["petName"] = petDetails.petName ? petDetails.petName : '';
            editData1["dateofBirth"] = petDetails.dateOfBirth ? this.customDatePipe.transform(petDetails.dateOfBirth, 'MM-dd-yyyy') : '';
            editData1["isDobUnknown"] = petDetails.isDobUnknown ? petDetails.isDobUnknown : false;
            editData1["breed"] = { "breedName": petDetails.breedName ? petDetails.breedName : '', "breedId": petDetails.breedId ? petDetails.breedId : '' };
            editData1["weightUnits"] = petDetails.weightUnit ? petDetails.weightUnit : '';
            editData1["weight"] = petDetails.weight ? petDetails.weight : '';
            editData1["status"] = petDetails.petStatusId ? petDetails.petStatusId : '1';
            if (petDetails.petStatusId == 3 || petDetails.petStatusId == 4) {
              editData1["statusDisable"] = true;
            }
            else {
              editData1["statusDisable"] = false;
            }
            editData1["petPreviousStatus"] = petDetails.petStatusId ? petDetails.petStatusId : '1';

            editData1["gender"] = petDetails.gender ? petDetails.gender : '';
            editData1["category"] = petDetails.isNeutered == true ? 'Neutered' : 'Spayed';
            editData1["species"] = petDetails.speciesId ? petDetails.speciesId : '';
            editData1["speciesName"] = petDetails.speciesName ? petDetails.speciesName : '';
            editData1["dateOfDeath"] = petDetails.dateOfDeath ? this.customDatePipe.transform(petDetails.dateOfDeath, 'MM-dd-yyyy') : '';
            editData1["isApproximateDateOfDeath"] = petDetails.isApproximateDateOfDeath ? petDetails.isApproximateDateOfDeath : false;
            editData1["lostToFollowUpDate"] = petDetails.lostToFollowUpDate ? this.customDatePipe.transform(petDetails.lostToFollowUpDate, 'MM-dd-yyyy') : '';
            editData1["isApproxLostToFollowUpDate"] = petDetails.isApproxLostToFollowUpDate ? petDetails.isApproxLostToFollowUpDate : false;
            editData1["isPetWithPetParent"] = petDetails.isPetWithPetParent;
            editData1["petAddress"] = petDetails.petAddress || {};

            this.tabservice.setModelData(editData1, 'petInfo');
            this.formDataCopy = JSON.parse(JSON.stringify(editData1));

            let petDevicesObj = Object.assign({}), petDevicesArr = [];
            petDetails.petDevices?.forEach((ele: any) => {
              petDevicesArr.push({
                "allocatedOn": ele.allocatedOn,
                "assetType": ele.deviceType ? { name: ele.deviceType } : '',
                "model": ele.deviceModel ? { name: ele.deviceModel } : '',
                "deviceNumber": { "deviceId": ele.deviceId, "deviceNumber": ele.deviceNumber },
                "disabled": false
              })
            });
            petDevicesObj["arr"] = petDevicesArr;
            this.tabservice.setModelData(petDevicesObj, 'petDevices');

            let editData2 = Object.assign({});
            let editData2Arr = [];
            petDetails.petStudyDevices?.forEach(ele => {
              this.studyArr && this.studyArr.forEach(res => {
                let isExist = editData2Arr.filter((study: any) => study.studyName.studyId == res.studyId).length;
                if (!isExist) {
                  if (ele.studyId == res.studyId) {
                    if (res.studyId == 2901)
                      this.isVirtual = true;
                    editData2Arr.push({
                      "studyName": { studyId: res.studyId ? res.studyId : '', studyName: res.studyName ? res.studyName : '', startDate: res.startDate, endDate: res.endDate },
                      "startDate": res.startDate ? moment(res.startDate).format("MM-DD-YYYY") : '',
                      "endDate": res.endDate ? moment(res.endDate).format("MM-DD-YYYY") : '',
                      "studyassDate": ele.studyAssignedOn ? moment(ele.studyAssignedOn).format("MM-DD-YYYY") : '',
                      "externalPet": (ele.externalPetInfoId != '' && ele.externalPetInfoId != 'null') ? { "externalPetId": ele.externalPetInfoId ? ele.externalPetInfoId : '', "externalPetValue": ele.externalPetValue ? ele.externalPetValue : '' } : '',
                      "isExternal": ele.external,
                      "disabled": false,
                      "isVirtual": (res.studyId == 2901) ? true : false,
                      "studyDescription": ele.studyDescription,
                      "minStudyDeviceAssignedDate": ele.minStudyDeviceAssignedDate ? moment(ele.minStudyDeviceAssignedDate).format("MM-DD-YYYY") : ''
                    });
                  }
                }
              })

            });
            if (editData2Arr.length > 0) {
              editData2["arr"] = editData2Arr;
              this.tabservice.setModelData(editData2, 'petStudy');
            }

            let editData3 = Object.assign({});
            let editData3Arr = [];
            petDetails.petStudyDevices?.forEach(ele => {
              if (ele.studyId && ele.deviceNumber) {
                editData3Arr.push({
                  "assignedOn": ele.assignedOn,
                  "deviceNumber": { "deviceId": ele.deviceId, "deviceNumber": ele.deviceNumber },
                  "model": ele.deviceModel ? { name: ele.deviceModel } : '',
                  "study": ele.studyId,
                  "studyName": ele.studyName,
                  "studyAssignedOn": ele.studyAssignedOn,
                  "studyEndDate": ele.studyEndDate,
                  'petStudyDeviceId': ele.petStudyDeviceId,
                  'petStudyId': ele.petStudyId,
                  'assetType': ele.deviceType ? { name: ele.deviceType } : '',
                  'unAssignedOn': ele.unAssignedOn ? ele.unAssignedOn : '',
                  'unAssignReason': ele.unAssignReason ? ele.unAssignReason : '',
                  'streamId': ele.dataStreamId ? ele.dataStreamId : '',
                  "disabled": false
                });
              }
            })
            editData3["arr"] = editData3Arr;
            if (editData3Arr.length > 0) {
              editData3["arr"] = editData3Arr;
              this.tabservice.setModelData(editData3, 'petStudyDevices');
            }

            let editData4Arr = [];
            petDetails.petParents.forEach(ele => {
              editData4Arr.push({
                "ppId": ele.petParentId,
                "ppName": ele.petParentName,
                "petParentFirstName": ele.firstName,
                "petParentLastName": ele.lastName,
                "ppEmail": ele.email ? ele.email : '',
                "phoneNumberValue": ele.phoneNumber ? ele.phoneNumber : '',
                "addr": ele.shippingAddress ? ele.shippingAddress : '',
                "secondaryEmail": ele.secondaryEmail ? ele.secondaryEmail : '',
                "residentialAddress": ele.residentialAddressString ? (ele.residentialAddressString || '-') : (ele.residentialAddress),
                "isShipAddrSameAsResdntlAddr": ele.isShipAddrSameAsResdntlAddr,
                "shippingAddress": ele.residentialAddressString ? ele.shippingAddressString : ele.shippingAddress,
                "isPetWithPetParent": ele.isPetWithPetParent
              });
            })
            //mobile number handling here as in pet parent infi tab ,
            //  it is breaking the logic on every tab click on it

            //format mobile number
            editData4Arr && editData4Arr.forEach(ele => {
              let phoneNumber = ele.phoneNumberValue;
              // debugger;
              if (phoneNumber) {
                // phoneNumber.replace(/ /g, "");
                // let desired = phoneNumber.replace(/[^\w\s]/gi, '');
                phoneNumber = phoneNumber.replace(/ /g, "");
                let desired = phoneNumber.replace(/[^\w\s]/gi, '');
                phoneNumber = desired;

                if (desired.startsWith("44")) {
                  phoneNumber = this.formatUKPhoneNumber(phoneNumber);
                }
                else {
                  phoneNumber = this.formatUSPhoneNumber(phoneNumber);
                }
                ele.phoneNumberValue = phoneNumber;
              }

            })
            this.tabservice.setModelData(editData4Arr, 'petExistingArr');

          }
          else {
            this.toastr.error(res.errors[0].message);
          }
          this.spinner.hide();
        }, err => {
          this.spinner.hide();
          console.log(err);
          this.errorMsg(err);
        }
        );
      }
    }


    this.getInitialData();
    this.spinner.hide();
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
    // let phoneNumberArr = phoneNumber.toString().split("44");
    let phoneNumberArr = phoneNumber.toString().split(/44(.+)/);
    let genPh = phoneNumberArr[1]
    // return phoneNumberArr[1].replace(/\s+/g, '').replace(/(.)(\d{4})(\d)/, '+44 $1 - $2 - $3');
    let newString = '+44' + ' ' + genPh.substr(0, 2) + '-' + genPh.substr(2, 4) + '-' + genPh.substr(6, 4);
    return newString
  }

  onSubmit($event) {

  }

  speciesSelected($event) {
    this.petInfoForm.patchValue({
      'breed': ''
    })
    let speciesId = $event.target.value;
    let breedFilter = [];
    breedFilter = this.breedArr;

    // this.newAArr =[];
    this.newAArr = breedFilter.filter(ele => ele.speciesId == speciesId);
  }

  statusChanged() {
    if (this.petInfoForm.value.status == 3) {
      this.petInfoForm.get('dateOfDeath').setValidators([Validators.required]);
      this.petInfoForm.get('lostToFollowUpDate').clearValidators();
    }
    else {
      if (this.petInfoForm.value.status == 4) {
        this.petInfoForm.get('lostToFollowUpDate').setValidators([Validators.required]);
      }
      else {
        this.petInfoForm.get('lostToFollowUpDate').clearValidators();
      }
      this.petInfoForm.get('dateOfDeath').clearValidators();
    }
    this.petInfoForm.get('dateOfDeath').updateValueAndValidity();
    this.petInfoForm.get('lostToFollowUpDate').updateValueAndValidity();
  }

  errorMsg(err) {
    if (err.status == 500) {
      this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
    }
    else {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    }
  }

  selectFileResult(event) {
    if (event.target.files[0] && 'jpeg, jpg, png, svg'
      .search(new RegExp(event.target.files[0].name.split('.')[1], 'i')) == -1) {
      this.toastr.error('Invalid file format (Valid formats are jpeg, jpg, png ,svg).', 'Error!');
      this.petInfoForm.patchValue({ 'petImage': '' });
      this.petInfoForm.markAsUntouched();
      return false;
    }
    //  if (event.target.files[0] && event.target.files[0].name.length > 30) {
    //   this.toastr.error('File Name cannot be greater than 30 characters.', 'Error!');
    //   return false;
    //  }
    let formData = new FormData();
    let selectedFile = event.target.files[0];
    formData.append("file", selectedFile);
    formData.append("moduleName", 'PetPhoto');
    this.spinner.show();
    this.petService.bulkUpload('/api/fileUpload/uploadFile', formData).subscribe(res => {
      this.spinner.hide();
      if (res && res.status.success) {
        // this.reloadDataTable();
        let fileName = '';
        let fileUrl = '';
        if (res.response.length > 0) {
          fileName = res.response[0];
          fileUrl = res.response[1];
        }
        this.petInfoForm.patchValue({ 'petImage': res.response, 'petImageUrl': fileUrl, 'petImageFileName': fileName });

      } else {
        this.toastr.error('Please select a valid file for uploading.', 'Error!');
      }
    }, err => {
      this.spinner.hide();
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.!');
    });

  }

  openPopup(div, size) {
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
    this.modalRef2.result.then((result) => {
      console.log(result);
    }, () => {
    });
  }

  changeValue() {
    this.modalRef2.close();
    this.submitFlag = true;
    this.tabservice.setModelData(this.petInfoForm.getRawValue(), 'petInfo');
    let data = this.tabservice.getModelData();
  }

  unChangeValue() {
    this.petInfoForm.patchValue({
      //'petImage': res.petImage ? res.petImage :'',
      // 'petImageUrl' : this.formDataCopy.petImageUrl ? this.formDataCopy.petImageUrl : '',
      // 'petImageFileName' :  this.formDataCopy.petImageFileName ? this.formDataCopy.petImageFileName : '',
      // 'petName': this.formDataCopy.petName ? this.formDataCopy.petName :'',
      // 'dateofBirth': this.formDataCopy.dateofBirth ? (this.customDatePipe.transform(this.formDataCopy.dateofBirth, 'MM-dd-yyyy')) :'',
      // 'breed':{"breedName": this.formDataCopy.breed ? this.formDataCopy.breed.breedName : '',"breedId":this.formDataCopy.breed ? this.formDataCopy.breed.breedId :''},
      // 'weightUnits':this.formDataCopy.weightUnits ? this.formDataCopy.weightUnits :'',
      // 'weight':this.formDataCopy.weight ? this.formDataCopy.weight :'',
      'status': this.formDataCopy.status ? this.formDataCopy.status : '',
      // 'gender':this.formDataCopy.gender ? this.formDataCopy.gender :'',
      // 'category':this.formDataCopy.category ? this.formDataCopy.category :'',
      // 'speciesName':this.formDataCopy.speciesName ? this.formDataCopy.speciesName : '',
      // 'species':this.formDataCopy.speciesId  ? this.formDataCopy.speciesId:''
    });
  }

  onCheckIsPetWithPetParent() {
    let arr = ['address1', 'address2', 'city', 'state', 'country', 'zipCode'];
    if (this.petInfoForm.value.isPetWithPetParent) {
      this.invalidAddress = false;
      arr.forEach((ele) => {
        this.petInfoForm.get('petAddress').get(ele).reset();
        this.petInfoForm.get('petAddress').get(ele).clearValidators();
        this.petInfoForm.get('petAddress').get(ele).updateValueAndValidity();
      });
    }
    else {
      arr.forEach((ele) => {
        if (ele != 'address2' && ele != 'zipCode')
          this.petInfoForm.get('petAddress').get(ele).setValidators([Validators.required]);
        else if (ele == 'zipCode')
          this.petInfoForm.get('petAddress').get(ele).setValidators([Validators.required, ValidationService.pinCodeValidator]);
      });
    }
  }

  validateAddress() {
    this.invalidAddress = false;
    let petDetails = this.petInfoForm.value.petAddress;
    if (petDetails.city && petDetails.state && petDetails.country && petDetails.zipCode && this.petInfoForm.get('petAddress').get('zipCode').valid) {
      this.spinner.show();
      this.lookupService.validateAddress({ params: { address1: petDetails.address1, address2: petDetails.address2, city: petDetails.city, state: petDetails.state, country: petDetails.country, zipCode: petDetails.zipCode } }).subscribe((res) => {
        this.spinner.hide();
        if (res.response.isValidAddress) {
          this.petInfoForm.get('petAddress').patchValue({ timeZoneId: res.response.address.timeZone.timeZoneId, timeZone: res.response.address.timeZone.timeZoneName });
        }
        else {
          this.invalidAddress = true;
          this.petInfoForm.get('petAddress').patchValue({ timeZoneId: '', timeZone: '' });
        }
      },
        err => {
          this.spinner.hide();
          if (err.status == 400) {
            this.invalidAddress = true;
            this.petInfoForm.get('petAddress').patchValue({ timeZoneId: '', timeZone: '' });
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
            return;
          }
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        }
      );
    }
  }

  next() {
    let data = this.tabservice.getModelData();

    this.petInfoForm.markAllAsTouched();
    if (this.petInfoForm.valid) {
      if (this.editFlag && !this.submitFlag) {
        let isOnStudyPet = this.petInfo && (this.petInfo.petStatusId == 2);

        if (isOnStudyPet && ((this.petInfoForm.value.status == "3" && this.formDataCopy.status != "3") || (this.petInfoForm.value.status == "1" && this.formDataCopy.status != "1" && (data.hasOwnProperty('petStudy')) || (this.petInfoForm.value.status == "4" && this.formDataCopy.status != "4")))) {
          this.openPopup(this.archiveContent, 'xs');
        }
        else {
          this.submitFlag = true;
          this.tabservice.setModelData(this.petInfoForm.getRawValue(), 'petInfo');
          if (!this.editFlag) {
            this.router.navigate(['/user/patients/add-patient/pet-asset'], { queryParams: this.queryParams });
          }
          else {
            this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-asset`], { queryParams: this.queryParams });
          }

        }
      }
      else {
        this.submitFlag = true;
        this.tabservice.setModelData(this.petInfoForm.getRawValue(), 'petInfo');
        if (!this.editFlag) {
          this.router.navigate(['/user/patients/add-patient/pet-asset'], { queryParams: this.queryParams });
        }
        else {
          this.router.navigate([`/user/patients/edit-patient/${this.editId}/pet-asset`], { queryParams: this.queryParams });
        }

      }

    }
    else {
      this.submitFlag = false;
    }
  }

  back() {

  }

  canDeactivate(component, route, state, next) {
    let data = this.tabservice.getModelData();
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if (next.url.indexOf('/add-patient') > -1 || next.url.indexOf('/edit-patient') > -1) {
      this.petInfoForm.markAllAsTouched();
      if (!this.petInfoForm.value.isPetWithPetParent && this.invalidAddress) {
        this.toastr.error("Enter a valid pet address");
        return false;
      }
      if (this.petInfoForm.valid) {
        if (this.editFlag && !this.submitFlag) {
          let isOnStudyPet = this.petInfo && (this.petInfo.petStatusId == 2);

          if (isOnStudyPet && ((this.petInfoForm.value.status == "3" && this.formDataCopy.status != "3") || (this.petInfoForm.value.status == "1" && this.formDataCopy.status != "1" && (data.hasOwnProperty('petStudy')) || (this.petInfoForm.value.status == "4" && this.formDataCopy.status != "4")))) {
            this.openPopup(this.archiveContent, 'xs');
          }
          else {
            this.submitFlag = true;
            this.tabservice.setModelData(this.petInfoForm.getRawValue(), 'petInfo');
          }
        }
        else {
          this.submitFlag = true;
          this.tabservice.setModelData(this.petInfoForm.getRawValue(), 'petInfo');
          // let data = this.tabservice.getModelData();
        }
      }
      else {
        this.submitFlag = false;
      }
    }
    else {
      let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
      if (this.petInfoForm.touched) { //this.petInfoForm.pristine == false || Object.keys(data).length > 0
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
