import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators, EmailValidator } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd, Params } from '@angular/router';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { LookupService } from 'src/app/services/util/lookup.service';
import { ToastrService } from 'ngx-toastr';
import { RolesService } from 'src/app/roles/components/roles.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ValidationService } from 'src/app/components/validation-message/validation.service';
import { AddUserService } from '../add-user.service';
import { AlertService } from 'src/app/components/alert-modal/alert.service';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-user-details',
  templateUrl: './add-user-details.component.html',
  styleUrls: ['./add-user-details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddUserDetailsComponent implements OnInit {
  addUserForm: FormGroup;
  RoleTypeArr: any;
  RoleArr: any;
  role: any[];
  selectedRoleType: boolean = false;
  editFlag: boolean = false;
  editId: string;
  submitFlag: any;
  disabledFlag: boolean = false;
  userDetails: any;
  @ViewChild('archiveContent') archiveContent: ElementRef;
  modalRef2: NgbModalRef;
  formDataCopy: any;
  chnageFlag: boolean;
  hiddenUserName: any;
  hiddenEmailId: any;
  hiddenFullName: any;
  hiddenRoleType: any;
  hiddenRoleName: any;
  hiddenStatus: any;
  activeRoles: any;
  hiddenUserId: any;
  queryParams: any = {};

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private tabservice: TabserviceService,
    private lookupService: LookupService,
    private roleService: RolesService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private adduserService: AddUserService,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private userDataService: UserDataService,
    private modalService: NgbModal
  ) {

    this.addUserForm = this.fb.group({
      'futureStudies': true,
      'userName': [''], /* , [Validators.required,ValidationService.exceptSpecialChar] */
      'fullName': ['', [Validators.required, ValidationService.whiteSpaceValidator]],
      'email': ['', [Validators.required, ValidationService.emailValidator]],
      'role': ['', [Validators.required]],
      'roleType': ['', [Validators.required]],
      'status': ['', [Validators.required]],
      'userId': ''
    });
  }

  onStatusChange($event) {
    console.log($event);
  }
  ngOnChanges() {
    //   let userId = this.userDataService.getUserId();
    //   console.log("usrid",userId);
    //   if(this.editId == userId ) {
    //   this.disabledFlag = true;
    // }

  }
  async ngOnInit() {

    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });

    if (this.router.url.indexOf('/edit-user') > -1) {
      this.editFlag = true;
    }
    this.spinner.show();
    await this.lookupService.getRole('/api/lookup/getActiveRoles').toPromise().then(res => {
      this.activeRoles = res.response.roles;
      if (this.editFlag) {
        this.RoleArr = res.response.roles;
      }
      this.spinner.hide();
    },
      err => {
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );

    await this.lookupService.getRoleTypes('/api/lookup/getRoleTypes').toPromise().then(res => {
      this.RoleTypeArr = res.response.roleTypes;
    },
      err => {
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );

    if (this.router.url.indexOf('/edit-user') > -1) {
      this.spinner.show();
      let str = this.router.url;
      let id = str.split("edit-user/")[1].split("/")[0]
      this.editId = id;
      let userId = this.userDataService.getUserId();
      if (this.editId == userId) {
        this.disabledFlag = true;
      }

      let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
      if (Object.keys(data).length == 0 || !data.addUserDetails) {
        this.adduserService.getUserById(`/api/users/${id}`, '').subscribe(res => {
          let user = res.response.user;

          this.hiddenUserName = res.response.user.userName;
          this.hiddenUserId = user.userId;
          this.hiddenEmailId = res.response.user.email;
          this.hiddenFullName = res.response.user.fullName;
          this.hiddenRoleType = user.roleTypeId ? user.roleTypeId : '';
          this.hiddenRoleName = user.roleIds ? user.roleIds : '';
          this.hiddenStatus = user.isActive === '' ? '' : (user.isActive === false ? '0' : '1');

          if (res.status.success == true) {

            let editData1 = Object.assign({});
            editData1["futureStudies"] = user.futureStudies === 1 ? true : false;
            editData1["userName"] = user.userName ? user.userName : '';
            editData1["fullName"] = user.fullName ? user.fullName : '';
            editData1["email"] = user.email ? user.email : '';
            let newObj = [];
            let finalObj = [];
            if (user.roleIds && user.roleIds.includes(",")) {
              let roleIdsArr = user.roleIds.toString().split(",")
              roleIdsArr && roleIdsArr.forEach(ele => {

                let roleCOpyArr = this.RoleArr.slice();

                newObj = roleCOpyArr.filter(
                  role => role.roleId == ele);
                finalObj.push(newObj[0])
              });

              editData1["role"] = finalObj;

            }
            else {
              let roleCOpyArr = this.RoleArr.slice();
              newObj = roleCOpyArr.filter(
                role => role.roleId == user.roleIds);
              finalObj.push(newObj[0])

              editData1["role"] = finalObj;
            }

            editData1["roleType"] = user.roleTypeId ? user.roleTypeId : '';
            editData1["status"] = user.isActive === '' ? '' : (user.isActive === false ? '0' : '1');
            editData1["userId"] = user.userId ? user.userId : '';

            this.tabservice.setModelData(editData1, 'addUserDetails');
            this.formDataCopy = JSON.parse(JSON.stringify(editData1));
            // this.userDetails = JSON.parse(JSON.stringify(person));

            let editData4 = Object.assign({});
            editData4["hiddenUserName"] = this.hiddenUserName;
            editData4["hiddenEmail"] = this.hiddenEmailId;
            editData4["hiddenFullName"] = this.hiddenFullName;
            editData4["hiddenRoleType"] = this.hiddenRoleType;
            editData4["hiddenRoleName"] = this.hiddenRoleName;
            editData4["hiddenStatus"] = this.hiddenStatus;
            editData4["hiddenUserId"] = this.hiddenUserId;

            this.tabservice.setModelData(editData4, 'HiddenData');

            let editData3 = Object.assign({});
            editData3["futureStudies"] = user.futureStudies == 1 ? true : false;
            editData3["inactiveStudies"] = user.inactiveStudies == 1 ? true : false;
            this.tabservice.setModelData(editData3, 'Studies');

            let editData2 = Object.assign({});
            let editData2Arr = [];
            user.associatedStudies && user.associatedStudies.forEach(ele => {
              if (ele.isActive) {
                editData2Arr.push({
                  clinicName: { "studyId": ele.studyId ? ele.studyId : '', "studyName": ele.studyName ? ele.studyName : '' },
                  status: ele.isActive === '' ? '' : (ele.isActive === false ? '0' : '1'),
                  permission: ele.permissionId ? ele.permissionId : '',
                  pInv: ele.principleInvestigator ? ele.principleInvestigator : ''
                });
              }
            })
            editData2["arr"] = editData2Arr;
            this.tabservice.setModelData(editData2, 'addAssStudy');

            let data = this.tabservice.getModelData();
            this.role = this.activeRoles.filter(role => role.roleTypeId == data.addUserDetails.roleType);
            this.RoleArr = this.activeRoles.filter(role => role.roleTypeId == data.addUserDetails.roleType);

            this.addUserForm.patchValue({
              'futureStudies': data.addUserDetails.futureStudies == true ? 1 : 0,
              'userName': data.addUserDetails.userName ? data.addUserDetails.userName : '',
              'fullName': data.addUserDetails.fullName ? data.addUserDetails.fullName : '',
              'email': data.addUserDetails.email ? data.addUserDetails.email : '',
              'role': data.addUserDetails.role ? data.addUserDetails.role : '',
              'roleType': data.addUserDetails.roleType ? data.addUserDetails.roleType : '',
              'status': data.addUserDetails.status ? data.addUserDetails.status : '',
              'userId': data.addUserDetails.userId ? data.addUserDetails.userId : ''
            });
          }
          else {
            this.toastr.error(res.errors[0].message);
          }
          this.spinner.hide();
        },
          err => {
            this.spinner.hide();
            this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
          }
        );
      }
      else {
        this.spinner.hide();
      }
    }


  }
  ngAfterViewInit() {
    //this.tabservice.dataModel$.subscribe(res => {
    let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {};
    if (!(data.hasOwnProperty('addUserDetails'))) {
      this.addUserForm.patchValue({
        'status': 1
      });
    }
    else {

      if (this.addUserForm.value.userName == '' && data.hasOwnProperty('addUserDetails')) {
        this.lookupService.getRole('/api/lookup/getActiveRoles').subscribe(res => {
          this.activeRoles = res.response.roles;
          this.role = this.activeRoles.filter(role => role.roleTypeId == data.addUserDetails.roleType);
          this.RoleArr = this.activeRoles.filter(role => role.roleTypeId == data.addUserDetails.roleType);

          this.addUserForm.patchValue({
            'futureStudies': data.addUserDetails.futureStudies == true ? 1 : 0,
            'userName': data.addUserDetails.userName ? data.addUserDetails.userName : '',
            'fullName': data.addUserDetails.fullName ? data.addUserDetails.fullName : '',
            'email': data.addUserDetails.email ? data.addUserDetails.email : '',
            'role': data.addUserDetails.role ? data.addUserDetails.role : '',
            'roleType': data.addUserDetails.roleType ? data.addUserDetails.roleType : '',
            'status': data.addUserDetails.status ? data.addUserDetails.status : '',
            'userId': data.addUserDetails.userId ? data.addUserDetails.userId : ''
          });
        },
          err => {
            this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
          }
        );
      }
    }

    // this.changeRoleType("",this.addUserForm.value.roleType ? this.addUserForm.value.roleType : '');
    this.formDataCopy = JSON.parse(JSON.stringify(this.addUserForm.value));
  }
  onSubmit($event) {
    this.addUserForm.markAllAsTouched();
  }
  roleSelected($event) {
    if ($event.roleTypeId) {
      this.addUserForm.patchValue({
        "roleType": $event.roleTypeId
      })
    }
  }
  changeRoleType($event: any, rold: any) {
    if (rold == '') {
      this.addUserForm.patchValue({
        "role": ""
      })
    }
    this.role = [];
    if ($event && $event.target.value) {
      this.selectedRoleType = true;
      this.role = this.activeRoles.filter(
        role => role.roleTypeId == $event.target.value);
    }
    else if (rold) {
      this.selectedRoleType = true;
      this.role = this.activeRoles.filter(
        role => role.roleTypeId == rold);
    }
    else {
      this.selectedRoleType = false;
    }
  }
  next() {
    // Object.keys(this.addUserForm.controls).forEach(key => {
    //   this.addUserForm.controls[key].markAsTouched();
    // });
    this.addUserForm.markAllAsTouched();
    if (this.addUserForm.valid) {


      if (this.editFlag) {
        let data = this.tabservice.getModelData();

        let data1 = data.addUserDetails;
        let data2 = this.addUserForm.value;

        if ((data1.email != data2.email) || (data1.fullName != data2.fullName) || (data1.role.roleId != data2.role.roleId) || (data1.roleType != data2.roleType) || (data1.status != data2.status) || (data1.userId != data2.userId) || (data1.userName != data2.userName)) {
          this.chnageFlag = true;
        }
        else {
          this.chnageFlag = false;
        }
      }
      if (this.editFlag && this.chnageFlag && !this.submitFlag) {
        this.openPopup(this.archiveContent, 'xs');
      }
      else {
        this.submitFlag = true;
        this.addUserForm.patchValue({ userName: this.addUserForm.value.email });
        this.tabservice.setModelData(this.addUserForm.value, 'addUserDetails');
        let data = this.tabservice.getModelData();
        if (!this.editFlag) {
          this.router.navigate(['/user/clinical-user/add-new-user/add-associated-study'], { queryParams: this.queryParams });
        }
        else {
          this.router.navigate([`/user/clinical-user/edit-user/${this.editId}/add-associated-study`], { queryParams: this.queryParams });
        }
      }

    }
    else {
      this.submitFlag = false;
    }
  }
  canDeactivate(component, route, state, next) {
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if (next.url.indexOf('/clinical-user/add-new-user') > -1 || next.url.indexOf('/clinical-user/edit-user') > -1) {
      this.addUserForm.markAllAsTouched();
      if (this.addUserForm.valid) {

        if (this.editFlag) {
          let data = this.tabservice.getModelData();

          let data1 = data.addUserDetails;
          let data2 = this.addUserForm.value;

          if ((data1.email != data2.email) || (data1.fullName != data2.fullName) || (data1.role.roleId != data2.role.roleId) || (data1.roleType != data2.roleType) || (data1.status != data2.status) || (data1.userId != data2.userId) || (data1.userName != data2.userName)) {
            this.chnageFlag = true;
          }
          else {
            this.chnageFlag = false;
          }
        }
        if (this.editFlag && this.chnageFlag && !this.submitFlag) {
          this.openPopup(this.archiveContent, 'xs');
        }
        else {
          this.submitFlag = true;
          this.addUserForm.patchValue({ userName: this.addUserForm.value.email });
          this.tabservice.setModelData(this.addUserForm.value, 'addUserDetails');
          let data = this.tabservice.getModelData();

        }
      }
      else {
        this.submitFlag = false;
      }
    }
    else {
      let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
      if (this.addUserForm.touched) { // this.addUserForm.pristine == false || Object.keys(data).length > 0 || this.addUserForm.dirty == false ||
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

  unChangeValue() {
    // this.formDataCopy = JSON.parse(JSON.stringify(this.addUserForm.value));
    // this.tabservice.getModelData
    let data = this.tabservice.getModelData() ? this.tabservice.getModelData() : {};
    if ((data.hasOwnProperty('addUserDetails'))) {
      this.formDataCopy = JSON.parse(JSON.stringify(data.addUserDetails))
    }
    this.addUserForm.patchValue({
      'futureStudies': this.formDataCopy.futureStudies,
      'userName': this.formDataCopy.email ? this.formDataCopy.email : '',
      'fullName': this.formDataCopy.fullName ? this.formDataCopy.fullName : '',
      'email': this.formDataCopy.email ? this.formDataCopy.email : '',
      'role': this.formDataCopy.role ? this.formDataCopy.role : '',
      'roleType': this.formDataCopy.roleType ? this.formDataCopy.roleType : '',
      'status': this.formDataCopy.status ? this.formDataCopy.status : '',
      'userId': this.formDataCopy.userId ? this.formDataCopy.userId : ''
    })
  }
  changeValue() {

    this.modalRef2.close();
    this.submitFlag = true;
    this.tabservice.setModelData(this.addUserForm.value, 'addUserDetails');

    //changing admin to non admin type
    // data1.roleType != data2.roleType
    let res = {};
    if (this.formDataCopy.roleType != this.addUserForm.value.roleType && this.addUserForm.value.roleType != 1) {
      res["futureStudies"] = 0;
      res["inactiveStudies"] = 0;
      this.tabservice.setModelData(res, 'Studies');
    }
    else {
      res["futureStudies"] = 1;
      res["inactiveStudies"] = 1;
    }

    //changing admin to non admin type

    let data = this.tabservice.getModelData();
    if (!this.editFlag) {
      this.router.navigate(['/user/clinical-user/add-new-user/add-associated-study'], { queryParams: this.queryParams });
    }
    else {
      this.router.navigate([`/user/clinical-user/edit-user/${this.editId}/add-associated-study`], { queryParams: this.queryParams });
    }

  }

  openPopup(div, size) {
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
  }

}