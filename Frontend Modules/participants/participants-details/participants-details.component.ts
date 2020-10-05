import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";

import { ROLES } from "app/shared/constants";
import { AlertService } from "app/shared/services/alert.service";
import { ParticipantsService } from "app/shared/services/participants.service";
import { RoleService } from "app/shared/services/role.service";
import { Participant } from "app/shared/classes/participant.interface";

@Component({
  selector: "app-participants-details",
  templateUrl: "./participants-details.component.html",
  styleUrls: ["./participants-details.component.scss"],
})
export class ParticipantsDetailsComponent {
  participant: Participant = { address: {} };
  participantId: string;
  ROLES = ROLES;
  userRole = "";

  constructor(
    private alert: AlertService,
    private roleService: RoleService,
    private activatedRoute: ActivatedRoute,
    private participantsService: ParticipantsService,
  ) {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.participantId = params["userId"];
      this.fetch();
    });
    this.userRole = this.roleService.activeRole;
  }

  parseDate(date) {
    return date ? date.split("T")[0] : "";
  }

  async fetch() {
    try {
      this.participant = JSON.parse(
        JSON.stringify(
          await this.participantsService.getParticpantInfo(this.participantId),
        ),
      );

      this.participant.address = this.participant.address || {};
      this.participant.location = this.participant.location || "";

      this.participant.dob = this.parseDate(this.participant.dob);
      this.participant.dateOfSurgery = this.parseDate(
        this.participant.dateOfSurgery,
      );
    } catch (err) {
      return this.alert.error(err);
    }
  }

  back() {
    window.history.back();
  }
}
