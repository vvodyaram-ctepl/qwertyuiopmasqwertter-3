import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '../guards/can-deactivate-guard.service';
import { AddDuplicatePetsComponent } from './add-duplicate-pets/add-duplicate-pets.component';
import { DataStreamsComponent } from './data-streams/data-streams.component';
import { PrimaryPetsListComponent } from './primary-pets-list/primary-pets-list.component';
import { SelectDuplicateComponent } from './select-duplicate/select-duplicate.component';
import { SelectPrimaryPetsComponent } from './select-primary-pets/select-primary-pets.component';
import { ViewDuplicatePetComponent } from './view-duplicate-pet/view-duplicate-pet.component';

const routes: Routes = [
  {
    path: "",
    component: PrimaryPetsListComponent,
    data: { title: "ListPrimaryPets" },
    canDeactivate: [CanDeactivateGuard]
  },
  {
    path: 'view-duplicate-pet/:id',
    component: ViewDuplicatePetComponent,
    data: { title: "viewDuplicatePet" },
  },
  {
    path: 'add-duplicate-pets',
    component: AddDuplicatePetsComponent,
    children: [
      {
        path: "",
        redirectTo: "select-primary-pets",
        pathMatch: "full"
      },
      {
        path: "select-primary-pets",
        component: SelectPrimaryPetsComponent,
        data: { title: "Primarypets" },
        canDeactivate: [CanDeactivateGuard]
      },
      {
        path: "select-duplicate",
        component: SelectDuplicateComponent,
        data: { title: "SelectDuplicate" },
        canDeactivate: [CanDeactivateGuard]
      },
      {
        path: "data-stream",
        component: DataStreamsComponent,
        data: { title: "DataStream" },
        canDeactivate: [CanDeactivateGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DuplicatePetsRoutingModule { }
