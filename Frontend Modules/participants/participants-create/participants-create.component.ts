import { Component, ViewChild, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import * as moment from "moment";

import { AlertService } from "app/shared/services/alert.service";
import { Participant } from "app/shared/classes/participant.interface";
import { ParticipantsService } from "app/shared/services/participants.service";
import { AppConstants } from "app/shared/constants";
import { StageService } from "app/shared/services/stage.service";
import { StateService } from "app/shared/services/state.service";

@Component({
  selector: "app-participants-create",
  styleUrls: ["./participants-create.component.scss"],
  templateUrl: "./participants-create.component.html",
})
export class ParticipantsCreateComponent implements OnInit {
  participant: Participant = { address: { state: "" } };
  loading: boolean = false;
  stages: any = [];
  states: any = [];
  locations: any;
  isDataLoaded: boolean = false;

  @ViewChild("f", { static: false }) form: NgForm;
  isFormSubmitted: Boolean = false;

  required_field_Error = AppConstants.DEFAULT_REQUIRED_FIELD_ERROR;
  incorrect_email_Error = AppConstants.INCORRECT_EMAIL_ADDRESS;
  emailValidator = AppConstants.EMAIL_PATTERN;
  zipValidator = AppConstants.ZIP_PATTERN;
  ERROR_REQUIRED_FIELDS = AppConstants.ERROR_REQUIRED_FIELDS;

  constructor(
    private participantsService: ParticipantsService,
    private alert: AlertService,
    private router: Router,
    private stageService: StageService,
    private stateService: StateService,
  ) {
    this.stageService.stagesObservable$.subscribe((stages) => {
      this.stages = stages;
      this.stages.unshift({ _id: "", name: "Select stage" });
    });
    this.stateService.statesObservable$.subscribe((states) => {
      this.states = states;
      this.states.unshift({ stateCode: "", state: "Select state" });
    });
  }

  async ngOnInit() {
    try {
      let response = await this.participantsService.getLocations();
      this.locations = response["locations"];

      this.locations.unshift({
        name: AppConstants.NOT_LOCATION_SPECIFIC,
        _id: "",
      });
      this.participant.stage =
        this.stages && this.stages.length ? this.stages[0]._id : null;
      this.participant.location =
        this.locations && this.locations.length ? this.locations[0]._id : null;
      this.isDataLoaded = true;
    } catch (err) {
      return this.alert.error(err.message);
    }
  }

  async formSubmitted() {
    try {
      this.isFormSubmitted = true;
      if (
        this.participant.address.zip &&
        !this.zipValidator.test(this.participant.address.zip)
      ) {
        return this.alert.error("Enter valid zip code");
      }

      this.loading = true;
      if (this.form.invalid) {
        this.loading = false;
        return this.alert.error(this.ERROR_REQUIRED_FIELDS);
      }

      this.participant.email = this.participant.email.toLowerCase().trim();
      const response = await this.participantsService.createParticipant(
        this.participant,
      );
      this.loading = false;
      this.router.navigate(["participants/listing"]);
      this.alert.success(response);
    } catch (err) {
      this.loading = false;
      this.alert.error(err);
    }
  }

  getToday() {
    return moment().format("YYYY-MM-DD");
  }
}
