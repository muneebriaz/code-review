import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { SharedModule } from "app/shared/shared.module";
import { ParticipantsRoutingModule } from "./participants-routing.module";

import { ParticipantBasicComponent } from "./participants-details/participant-basic/participant-basic.component";
import { ParticipantsTableComponent } from "./participants-table/participants-table.component";
import { ParticipantProgramComponent } from "./participants-details/participant-program/participant-program.component";
import { ParticipantsDetailsComponent } from "./participants-details/participants-details.component";
import { ParticipantsListingComponent } from "./participants-listing/participants-listing.component";
import { ParticipantSurgeonsComponent } from "./participants-details/participant-surgeons/participant-surgeons.component";

import { ParticipantsService } from "app/shared/services/participants.service";
import { ParticipantsCreateComponent } from "./participants-create/participants-create.component";
import { ParticipantQuestionnaireComponent } from "./participants-details/participant-questionnaire/participant-questionnaire.component";
import { ParticipantQuestionnaireDetailComponent } from "./participants-details/participant-questionnaire-detail/participant-questionnaire-detail.component";
import { ParticipantAlertsComponent } from "./participants-details/participant-alerts/participant-alerts.component";
import { ParticipantAlertDetailComponent } from "./participants-details/participant-alert-detail/participant-alert-detail.component";
import { ParticipantAlertNoteModalComponent } from "./participants-details/participant-alert-note-modal/participant-alert-note-modal.component";

@NgModule({
  imports: [
    NgbModule,
    FormsModule,
    CommonModule,
    SharedModule,
    ParticipantsRoutingModule,
  ],
  declarations: [
    ParticipantsCreateComponent,
    ParticipantBasicComponent,
    ParticipantsTableComponent,
    ParticipantProgramComponent,
    ParticipantsListingComponent,
    ParticipantsDetailsComponent,
    ParticipantSurgeonsComponent,
    ParticipantQuestionnaireComponent,
    ParticipantQuestionnaireDetailComponent,
    ParticipantAlertsComponent,
    ParticipantAlertDetailComponent,
    ParticipantAlertNoteModalComponent,
  ],
  providers: [ParticipantsService],
  entryComponents: [ParticipantAlertNoteModalComponent],
})
export class ParticipantsModule {}
