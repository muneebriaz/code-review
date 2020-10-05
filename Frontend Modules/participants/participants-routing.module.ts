import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { ParticipantsListingComponent } from "./participants-listing/participants-listing.component";
import { ParticipantsDetailsComponent } from "./participants-details/participants-details.component";
import { ParticipantsCreateComponent } from "./participants-create/participants-create.component";

const routes: Routes = [
  {
    path: "listing",
    component: ParticipantsListingComponent,
    data: {
      title: "Participants Listing",
    },
  },
  {
    path: "create",
    component: ParticipantsCreateComponent,
    data: {
      title: "Participants Create",
    },
  },
  {
    path: ":userId",
    component: ParticipantsDetailsComponent,
    data: {
      title: "Participants Details",
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParticipantsRoutingModule {}
