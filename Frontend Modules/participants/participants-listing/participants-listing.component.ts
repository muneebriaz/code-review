import { Component, OnInit } from "@angular/core";
import { NgbPaginationConfig } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Params } from "@angular/router";

import { ParticipantsService } from "app/shared/services/participants.service";
import { confirmCancelButton as confirm } from "app/shared/data/sweet-alerts";
import { Pagination } from "app/shared/classes/pagination.class";
import { PaginationConfig } from "app/shared/configs/pagination.config";
import { AlertService } from "app/shared/services/alert.service";
import { RoleService } from "app/shared/services/role.service";
import { ROLES } from "app/shared/constants";
import { StageService } from "app/shared/services/stage.service";

@Component({
  selector: "app-participants-listing",
  templateUrl: "./participants-listing.component.html",
  styleUrls: ["./participants-listing.component.scss"],
})
export class ParticipantsListingComponent implements OnInit {
  search = "";
  participants = [];
  loading: boolean = false;
  pagination = new Pagination();
  pgConfig: NgbPaginationConfig = new NgbPaginationConfig();
  role: string;
  ROLES = ROLES;

  constructor(
    private activatedRoute: ActivatedRoute,
    private roleService: RoleService,
    private stageService: StageService,
    private participantsService: ParticipantsService,
    private paginationConfig: PaginationConfig,
    private alert: AlertService,
  ) {
    this.role = this.roleService.activeRole;
    this.pgConfig = this.paginationConfig.getConfig();
  }

  async ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.search = params["search"];
      this.getParticipants(this.search ? 1 : undefined);
    });
  }

  async download() {
    try {
      if (
        await confirm("Confirmation!", "Do you want to Export participants?")
      ) {
        await this.participantsService.export(this.search);
      }
    } catch (error) {
      this.alert.error(error);
    }
  }

  async getParticipants(page?: number) {
    try {
      this.loading = true;
      let response = await this.participantsService.getParticipantsListing({
        page,
        search: this.search,
      });
      this.loading = false;

      this.participants = response["participants"];
      this.pagination.autoInitialize(response);
    } catch (error) {
      this.loading = false;
      return this.alert.error(error);
    }
  }

  async resendInviteLink(email) {
    try {
      if (
        await confirm(
          "Are you sure?",
          `Are you sure you want to resend invite link to this participant?`,
        )
      ) {
        await this.participantsService.resendInviteLink(email);
        this.alert.success("Invitation link has been sent again");
      }
    } catch (err) {
      return this.alert.error(err);
    }
  }

  async suspendActiveParticipant(participantId: string, status: string) {
    try {
      status = status === "active" ? "suspended" : "active";
      if (
        await confirm(
          "Are you sure?",
          `Are you sure you want to ${
            status === "active" ? "activate" : "suspend"
          } this participant?`,
        )
      ) {
        await this.participantsService.suspendParticipant(
          participantId,
          status,
        );
        this.ngOnInit();
        this.alert.success(`User ${status} successfully`);
      }
    } catch (err) {
      return this.alert.error(err);
    }
  }
}
