import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { PetService } from 'src/app/patient/pet.service';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';

@Component({
  selector: 'app-pet-data-extract',
  templateUrl: './pet-data-extract.component.html',
  styleUrls: ['./pet-data-extract.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PetDataExtractComponent implements OnInit {
  headers: any;
  petId: any;
  public showDataTable: boolean = true;
  petNamesList= [];
  breedArray = [];
  genderArray = [];
  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private petService: PetService,
    public customDatePipe: CustomDateFormatPipe
  ) {
  }

  ngOnInit() { 
    this.petService.getPet('/api/lookup/getPetName', '').subscribe(res => {
      this.petNamesList = res.response.petNameList ? res.response.petNameList : null;
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
    this.petService.getPet('/api/lookup/getPetBreeds', '').subscribe(res => {
      this.breedArray = res.response.breeds;
      this.genderArray = [{ id: "Male", value: "Male" }, { id: "Female", value: "Female" }];
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
    this.headers = [
      { key: "petPhotoUrl", label: "", checked: true, width: 50 },
      { key: "petName", label: "Pet Name", checked: true, clickable: true },
      { key: "petParentName", label: "Pet Parent Name", checked: true },
      { key: "gender", label: "Gender", checked: true },
      { key: "dateOfBirth", label: "Date of Birth", checked: true },
      { key: "breedName", label: "Breed", checked: true }
    ];

  }
  formatter($event) {
    $event.forEach(element => {
      if (element.petPhoto) {
        element.petPhotoUrl = `<span class="petImage"><img class="dog-circle" src= ` +
          element.petPhotoUrl + ` height="38" width="38"></span>`
      } else {
        element.petPhotoUrl = '<span class="petImage"><img class="dog-circle" src="assets/images/no-dogs.svg" height="38" width="38"></span>';
      }
      element.dateOfBirth = this.customDatePipe.transform(element.dateOfBirth, 'MM/dd/yyyy');

    });
  }
  getNode($event) {
    console.log($event);
    if ($event.header === 'petName') {
      // this.router.navigate(['/user/petDataExtract/view-pet-data-extract/', $event.item.petId]);
      let petId = $event.item.petId;
      this.router.navigate([`/user/petDataExtract/view-pet-data-extract/${petId}/edit`]);
    }
  }

}








