import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { AlertService } from "app/shared/services/alert.service";
import { RoleService } from "app/shared/services/role.service";
import { ParticipantsService } from "app/shared/services/participants.service";
import { StageService } from "app/shared/services/stage.service";
import { AppConstants, ROLES } from "app/shared/constants";

@Component({
  selector: "app-participant-program",
  templateUrl: "./participant-program.component.html",
  styleUrls: ["./participant-program.component.scss"],
})
export class ParticipantProgramComponent implements OnInit {
  @Input() participant: any;
  formLoaded: boolean = false;
  participantId: string;
  stages: any = [];
  locations: any;
  primary: boolean = false;
  sceondary: boolean = false;
  isDataLoaded: boolean = false;
  PARTICIPANT_TYPES = AppConstants.PARTICIPANT_TYPES;
  ROLES = ROLES;
  userRole = "";

  constructor(
    private _route: ActivatedRoute,
    private participantsService: ParticipantsService,
    private roleService: RoleService,
    private alert: AlertService,
    private stageService: StageService,
  ) {
    this.userRole = this.roleService.activeRole;
    this.participantId = this._route.snapshot.params["userId"];
    this.formLoaded = true;
    this.stageService.stagesObservable$.subscribe(
      (stages) => (this.stages = stages),
    );
  }

  async ngOnInit() {
    try {
      let response = await this.participantsService.getLocations();
      this.locations = response["locations"];

      this.locations.unshift({
        name: AppConstants.NOT_LOCATION_SPECIFIC,
        _id: "",
      });
      this.isDataLoaded = true;
    } catch (err) {
      return this.alert.error(err);
    }
  }

  async formSubmitted() {
    try {
      this.participant.isLocationSpecific = !!this.participant.location;
      const response = await this.participantsService.updateParticipantBasicInfo(
        this.participantId,
        this.participant,
      );
      return this.alert.success(response);
    } catch (err) {
      return this.alert.error(err);
    }
  }
}
