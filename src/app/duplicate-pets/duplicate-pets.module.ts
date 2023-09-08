import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DuplicatePetsRoutingModule } from './duplicate-pets-routing.module';
import { SelectPrimaryPetsComponent } from './select-primary-pets/select-primary-pets.component';
import { AddDuplicatePetsComponent } from './add-duplicate-pets/add-duplicate-pets.component';
import { SharedModule } from '../shared/shared.module';
import { DatatableModule } from 'projects/datatable/src/public-api';
import { SelectDuplicateComponent } from './select-duplicate/select-duplicate.component';
import { DataStreamsComponent } from './data-streams/data-streams.component';
import { PrimaryPetsListComponent } from './primary-pets-list/primary-pets-list.component';
import { ViewDuplicatePetComponent } from './view-duplicate-pet/view-duplicate-pet.component';


@NgModule({
  declarations: [SelectPrimaryPetsComponent, AddDuplicatePetsComponent, SelectDuplicateComponent, DataStreamsComponent, PrimaryPetsListComponent, ViewDuplicatePetComponent],
  imports: [
    CommonModule,
    DuplicatePetsRoutingModule,
    SharedModule,
    DatatableModule,
  ]
})
export class DuplicatePetsModule { }
