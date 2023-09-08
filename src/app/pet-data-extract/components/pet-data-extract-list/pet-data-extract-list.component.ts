import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { PetService } from 'src/app/patient/pet.service';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-pet-data-extract-list',
  templateUrl: './pet-data-extract-list.component.html',
  styleUrls: ['./pet-data-extract-list.component.scss']
})
export class PetDataExtractListComponent implements OnInit {
  headers: any;
  filterTypeArr: any[];
  petNamesList = [];
  breedArray = [];
  genderArray = [];
  RWFlag: boolean;
  modalRef2: NgbModalRef;
  petParentId: any;
  parentName: any;
  showDataTable: boolean = true;
  filteredObj: any;
  filterParams: any = {};

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private petService: PetService,
    public customDatePipe: CustomDateFormatPipe,
    private userDataService: UserDataService,
  ) { }

  ngOnInit() {
    //permission for the module
    let userProfileData = this.userDataService.getRoleDetails();
    console.log("userProfileData", userProfileData);
    let menuActionId = '';
    userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
      if (ele.menuId == "43") {
        menuActionId = ele.menuActionId;
      }
    });
    if (menuActionId == "3") {
      this.RWFlag = true;
    }
    this.petService.getPet('/api/lookup/getPetBreeds', '').subscribe(res => {
      this.breedArray = res.response.breeds;
      this.genderArray = [{ id: "Male", value: "Male" }, { id: "Female", value: "Female" }]
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
    this.petService.getPet('/api/lookup/getPetName', '').subscribe(res => {
      this.petNamesList = res.response ? res.response.petNameList : null;
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
    this.headers = [
      { key: "petId", label: "Pet ID", checked: true, clickable: true, sortable: true },
      { key: "petName", label: "Pet Name", checked: true, sortable: true },
      { key: "createdBy", label: "Created By", checked: true, width: 200 },
      { key: "createdDate", label: "Created on", checked: true, sortable: true },
    ];

    this.route.queryParams.subscribe((obj: any) => {
      this.filterParams = obj;
    })
  }

  formatter($event) {
    $event.forEach(ele => {
      ele.createdDate = this.customDatePipe.transform(ele.createdDate, 'MM/dd/yyyy');
      ele.id = ele.rnum;

      if (ele.petNames) {
        ele.petNames = ele.petNames.toString().split(',').join(', ');
      }

      if (ele.isActive == true) {
        ele.isActive = "Active";
        ele['columnCssClass']['isActive'] = "active-status";
      } else {
        ele.isActive = "Inactive";
        ele['columnCssClass']['isActive'] = "inactive-status";
      }
      if (ele.petParentFirstName) {
        ele['petParentName'] = ele.petParentFirstName + " " + ele.petParentLastName;
      }

    });
  }

  getNode($event) {
    console.log($event);
    if ($event.header === 'petId') {
      // this.router.navigate(['/user/petDataExtract/view-pet-data-extract/', $event.item.petId]);
      let petId = $event.item.petId;
      this.router.navigate([`/user/petDataExtract/view-pet-data-extract/${petId}/view`]);

    }

  }
  public reloadDatatable() {
    this.showDataTable = false;
    setTimeout(() => {
      this.showDataTable = true;
    }, 1);
  }
  selectPrimaryPets() {
    this.router.navigate(['/user/petDataExtract/manage-pet-data-extract'], { queryParams: this.filteredObj });
  }

  filterObj(obj: any) {
    this.filteredObj = obj;
  }
}


