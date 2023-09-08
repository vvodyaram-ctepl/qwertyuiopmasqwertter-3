import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatatableModule } from 'projects/datatable/src/public-api';
import { PetDataExtractRoutingModule } from './pet-data-extract-routing.module';
import { PetDataExtractComponent } from './components/pet-data-extract/pet-data-extract.component';
import { ViewPetDataExtractComponent } from './components/view-pet-data-extract/view-pet-data-extract.component';
import { PetDataExtractListComponent } from './components/pet-data-extract-list/pet-data-extract-list.component';
import { DatepickerModule } from 'projects/datepicker/src/public_api';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [PetDataExtractComponent, ViewPetDataExtractComponent, PetDataExtractListComponent],
  imports: [
    CommonModule,
    DatatableModule,
    DatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    PetDataExtractRoutingModule
  ]
})
export class PetDataExtractModule { }
