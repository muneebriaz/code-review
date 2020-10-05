import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NgbPaginationConfig } from "@ng-bootstrap/ng-bootstrap";

import { AlertService } from "app/shared/services/alert.service";
import { confirmCancelButton as confirm } from "app/shared/data/sweet-alerts";
import { Pagination } from "app/shared/classes/pagination.class";
import { PaginationConfig } from "app/shared/configs/pagination.config";
import { ParticipantQuestionAlertService } from "app/shared/services/participant-question-alert.service";
import { AppConstants } from "app/shared/constants";
import { AlertDetail } from "app/shared/classes/alertDetail.interface";

@Component({
  selector: "app-participant-alerts",
  templateUrl: "./participant-alerts.component.html",
  styleUrls: ["./participant-alerts.component.scss"],
})
export class ParticipantAlertsComponent implements OnInit {
  showDetail: Boolean = false;
  participantId: string;
  loading: Boolean = false;
  pagination = new Pagination();
  participantsAlerts: Array<AlertDetail> = [];
  oldAlerts: Array<AlertDetail> = [];
  alertDetail: AlertDetail = {};
  pgConfig: NgbPaginationConfig = new NgbPaginationConfig();
  alertActions = AppConstants.ALERT_ACTIONS;
  alertTypes = AppConstants.ALERTS_TYPES;

  constructor(
    private _route: ActivatedRoute,
    private alert: AlertService,
    private paginationConfig: PaginationConfig,
    private participantQuestionAlertService: ParticipantQuestionAlertService,
  ) {
    this.participantId = this._route.snapshot.params["userId"];
    this.pgConfig = this.paginationConfig.getConfig();
    this.getParticipantAlert();
  }

  ngOnInit() {}

  async showAlertsDetail(alertId) {
    try {
      let response = await this.participantQuestionAlertService.getParticipantQuestionAlertDetails(
        alertId,
      );
      this.alertDetail = response["alert"];
      this.showDetail = true;
    } catch (error) {
      return this.alert.error(error);
    }
  }

  backToResponse(updatedAlert) {
    let target = this.participantsAlerts.find(pa => pa._id.toString() === updatedAlert._id.toString())
    if (target) {
      target.status = updatedAlert.status;
    }
    this.showDetail = !this.showDetail;
  }

  async getParticipantAlert(page?: number) {
    try {
      this.loading = true;

      let response = await this.participantQuestionAlertService.getParticipantQuestionAlert(
        this.participantId,
        page,
      );
      this.loading = false;

      this.participantsAlerts = response["alerts"];
      this.oldAlerts = JSON.parse(JSON.stringify(response["alerts"]));
      this.pagination.autoInitialize(response);
    } catch (error) {
      return this.alert.error(error);
    }
  }

  async updateStatus(event, alert) {
    if (
      !(await confirm("Are you sure?", "Do you want update this alert status?"))
    ) {
      this.participantsAlerts = JSON.parse(JSON.stringify(this.oldAlerts));
      return;
    }

    try {
      let response = await this.participantQuestionAlertService.updateParticipantQuestionAlertStatus(
        alert._id,
        event.target.value,
      );
      var foundIndex = this.oldAlerts.findIndex(
        (x) => x._id == response["alert"]._id,
      );
      this.oldAlerts[foundIndex] = response["alert"];
      this.alert.success("Status updated successfully");
    } catch (error) {
      this.alert.error(error);
    }
  }
}
