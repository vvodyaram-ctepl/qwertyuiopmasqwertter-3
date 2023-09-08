import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/services/util/login.service';
import { ToastrService } from 'ngx-toastr';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { ValidationService } from 'src/app/components/validation-message/validation.service';
import { PasswordMatch } from 'src/app/validators/password.match';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserProfileComponent implements OnInit {

  updateForm: FormGroup;
  userForm: FormGroup;
  showChangePwdDiv: boolean = false;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginService: LoginService,
    private toastr: ToastrService,
    private userDataService: UserDataService,
    private spinner: NgxSpinnerService
  ) {
    this.updateForm = this.fb.group({
      userId: [''],
      email: [''],
      userName: [''],
      password: ['', [Validators.required]],
      newPassword: ['', [Validators.required, ValidationService.passwordValidator]],
      confirmPassword: ['', [Validators.required, ValidationService.passwordValidator]]
    }, { validator: PasswordMatch.MatchPassword });

    this.userForm = this.fb.group({
      userName: [''],
      fullName: [''],
      Email: [''],
      Role: ['']
    });

  }

  ngOnInit() {

    let data = this.userDataService.getUserId();
    this.updateForm.patchValue({ userId: data });
    let userProfileData = this.userDataService.getUserDetails();
    this.updateForm.patchValue({
      email: userProfileData.email,
      userName: userProfileData.userName
    });

    this.getUserDetails();

  }
  getUserDetails(/* reload?: boolean */) {
    this.spinner.show();
    this.loginService.getUserDetails('/api/users/getUserDetails/' + this.userDataService.getUserId()).subscribe(res => {
      if (res.status.success === true) {
        this.userDataService.setUserData({ userId: res.response.userId, userName: res.response.username });
        this.userDataService.setUserDetails(res.response.userName, res.response.roleName, res.response.email, res.response.fullName);
        /* if (reload)
          window.location.reload(); */
        this.userForm.patchValue({
          userName: res.response.userName,
          fullName: res.response.fullName,
          Email: res.response.email,
          Role: res.response.roleName
        });
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.!');
      this.spinner.hide();
    });
  }
  update() {
    this.updateForm.markAllAsTouched();
    if (this.updateForm.valid) {
      this.spinner.show();
      this.loginService.updatePassword('/api/users/updatePassword', this.updateForm.value).subscribe(res => {
        if (res.status.success === true) {
          this.toastr.success(res.response.message);
          this.getUserDetails();
        }
        else {
          this.toastr.error(res.errors[0].message);
        }
        this.spinner.hide();
      }, err => {
        this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.!');
        this.spinner.hide();
      });
    }
  }
  updateUser() {
    this.spinner.show();
    this.loginService.updatePassword('/api/users/updateUserProfile', { fullName: this.userForm.value.fullName, userId: this.userDataService.getUserId() }).subscribe(res => {
      if (res.status.success === true) {
        this.toastr.success(res.response.message);
        this.getUserDetails(/* true */); //true is check for reloading the application to update the full name in the top header
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.!');
      this.spinner.hide();
    });
  }
  openResetPassword() {
    this.showChangePwdDiv = (this.showChangePwdDiv == false) ? true : false;
  }
  redirectToChangePassword() {
    this.router.navigate(['/user/changePassword']);
  }
}
