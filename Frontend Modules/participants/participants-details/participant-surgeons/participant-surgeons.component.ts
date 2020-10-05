import { Component } from "@angular/core";
import { Surgeon } from "app/shared/classes/surgeon.interface";
import { Pagination } from "app/shared/classes/pagination.class";
import { ActivatedRoute } from "@angular/router";
import { NgbPaginationConfig } from "@ng-bootstrap/ng-bootstrap";
import { PaginationConfig } from "app/shared/configs/pagination.config";

import { ParticipantsService } from "app/shared/services/participants.service";
import { AlertService } from "app/shared/services/alert.service";

@Component({
  selector: "app-participant-surgeons",
  styleUrls: ["./participant-surgeons.component.scss"],
  templateUrl: "./participant-surgeons.component.html",
})
export class ParticipantSurgeonsComponent {
  linkedSurgeons: Array<Surgeon>;
  unlinkedSurgeons: Array<Surgeon>;
  participantId: string;
  loading: boolean = false;
  loadingLinked: boolean = false;
  loadingUnlinked: boolean = false;
  pagination = new Pagination();
  pgConfig: NgbPaginationConfig = new NgbPaginationConfig();

  constructor(
    private participantsService: ParticipantsService,
    private _route: ActivatedRoute,
    private alert: AlertService,
    private paginationConfig: PaginationConfig,
  ) {
    this.pgConfig = this.paginationConfig.getConfig();
    this.participantId = this._route.snapshot.params["userId"];
    this.getLinkedSurgeons();
    this.getUnlinkedSurgeons();
  }

  async getLinkedSurgeons() {
    try {
      this.loadingLinked = true;
      let response = await this.participantsService.getLinkedSurgeons(
        this.participantId,
      );
      this.linkedSurgeons = response["providers"];
      this.loadingLinked = false;
    } catch (err) {
      this.loadingLinked = false;
      return this.alert.error(err.message);
    }
  }

  async makeSurgeonDefault(surgeonId) {
    try {
      let response = await this.participantsService.makeSurgeonDefault(
        this.participantId,
        surgeonId,
      );
      if (response["providers"]) {
        this.linkedSurgeons = response["providers"];
      }
      this.alert.success("Surgeon marked as primary successfully");
    } catch (error) {
      return this.alert.error(error);
    }
  }

  async getUnlinkedSurgeons(page?: number) {
    try {
      this.loadingUnlinked = true;
      let response = await this.participantsService.getUnlinkedSurgeons(
        this.participantId,
        page,
      );
      this.unlinkedSurgeons = response["unlinkedProviders"];
      this.pagination.autoInitialize(response);
      this.loadingUnlinked = false;
    } catch (err) {
      this.loadingUnlinked = false;
      return this.alert.error(err);
    }
  }

  async linkUnlink({ surgeonId, isLink }) {
    try {
      this.loading = true;
      isLink
        ? await this.participantsService.linkSurgeon(
            this.participantId,
            surgeonId,
          )
        : await this.participantsService.unlinkSurgeon(
            this.participantId,
            surgeonId,
          );
      this.loading = false;
      this.getLinkedSurgeons();
      this.getUnlinkedSurgeons();
      this.alert.success(
        `Surgeon ${isLink ? "linked" : "unlinked"} successfully`,
      );
    } catch (err) {
      this.loading = false;
      this.alert.error(err.message);
    }
  }
}
