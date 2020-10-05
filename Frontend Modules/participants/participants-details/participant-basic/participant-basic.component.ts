import { Component, OnInit, EventEmitter, Output, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as moment from "moment";

import { ParticipantsService } from "app/shared/services/participants.service";
import { AppConstants, ROLES, STYLES } from "app/shared/constants";
import { AlertService } from "app/shared/services/alert.service";
import { RoleService } from "app/shared/services/role.service";
import { Participant } from "app/shared/classes/participant.interface";
import { StateService } from "app/shared/services/state.service";

@Component({
  selector: "app-participant-basic",
  templateUrl: "./participant-basic.component.html",
  styleUrls: ["./participant-basic.component.scss"],
})
export class ParticipantBasicComponent {
  participantId: string;
  @Input() participant: Participant = { address: {} };

  required_field_Error = AppConstants.DEFAULT_REQUIRED_FIELD_ERROR;
  states: any;
  zipValidator = AppConstants.ZIP_PATTERN;
  STYLES = STYLES;
  ROLES = ROLES;
  userRole = "";

  constructor(
    private _route: ActivatedRoute,
    private participantsService: ParticipantsService,
    private roleService: RoleService,
    private statesService: StateService,
    private alert: AlertService,
  ) {
    this.userRole = this.roleService.activeRole;
    this.participantId = this._route.snapshot.params["userId"];
    this.statesService.statesObservable$.subscribe(
      (states) => (this.states = states),
    );
  }

  async formSubmitted() {
    try {
      if (this.participant.dob > this.getToday()) {
        return this.alert.error("Date of birth can not be from future");
      }
      if (!this.participant.name) {
        return this.alert.error("Name can not be empty");
      }
      if (
        this.participant.address.zip &&
        !this.zipValidator.test(this.participant.address.zip)
      ) {
        return this.alert.error("Enter valid zip code");
      }
      const response = await this.participantsService.updateParticipantBasicInfo(
        this.participantId,
        this.participant,
      );
      this.alert.success(response);
    } catch (err) {
      return this.alert.error(err.message);
    }
  }

  async suspendUser() {
    try {
      this.participant.status === "active"
        ? (this.participant.status = "suspended")
        : (this.participant.status = "active");
      await this.participantsService.suspendParticipant(
        this.participantId,
        this.participant.status,
      );
      this.alert.success(`User ${this.participant.status} successfully`);
    } catch (err) {
      return this.alert.error(err);
    }
  }

  getToday() {
    return moment().format("YYYY-MM-DD");
  }
}
