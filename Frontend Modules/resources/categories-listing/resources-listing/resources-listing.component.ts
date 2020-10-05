import { Component, ViewChild } from "@angular/core";
import { NgbPaginationConfig } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Params } from "@angular/router";

import { AlertService } from "app/shared/services/alert.service";
import { AppConstants } from "app/shared/constants";
import { confirmCancelButton as confirm } from "app/shared/data/sweet-alerts";
import { Pagination } from "app/shared/classes/pagination.class";
import { PaginationConfig } from "app/shared/configs/pagination.config";
import { Resource } from "app/shared/classes/resource.interface";
import { ResourcesService } from "app/shared/services/resources.service";

@Component({
  selector: "app-resources-listing",
  styleUrls: ["./resources-listing.component.scss"],
  templateUrl: "./resources-listing.component.html",
})
export class ResourcesListingComponent {
  loading: boolean = false;
  resources: Array<Resource> = [];
  allResources: Array<Resource> = [];
  resourceCategoryId: string;
  resourceCategoryName: string;
  deleteMessage = AppConstants.DELETE_MESSAGE;
  pagination = new Pagination();
  pgConfig: NgbPaginationConfig = new NgbPaginationConfig();
  search = "";
  reordering: boolean = false;
  @ViewChild("reorderResources", { static: false }) reorderResources: any;

  constructor(
    private alert: AlertService,
    private activatedRoute: ActivatedRoute,
    private paginationConfig: PaginationConfig,
    private resourcesService: ResourcesService,
  ) {
    this.pgConfig = this.paginationConfig.getConfig();
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.search = params["search"];
      this.resourceCategoryId = this.activatedRoute.snapshot.params[
        "resourceCategoryId"
      ];
      this.getResources(this.search ? 1 : undefined);
    });
  }

  async getResources(page?: number) {
    try {
      this.loading = true;
      let response = await this.resourcesService.getResources({
        resourceCategoryId: this.resourceCategoryId,
        page,
        search: this.search,
      });
      this.resources = response["resources"];
      this.resourceCategoryName = response["resourceCategory"];
      this.pagination.autoInitialize(response);
      this.loading = false;
      this.reordering = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  async delete(resourceId: string) {
    try {
      let response = await confirm(
        this.deleteMessage.question,
        this.deleteMessage.message,
        this.deleteMessage.type,
      );
      if (response === true) {
        this.loading = true;
        await this.resourcesService.deleteResource(resourceId);
        this.getResources();
      }
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  async allowReordering() {
    try {
      this.loading = true;
      this.allResources = await this.resourcesService.getAllResources({
        categoryId: this.resourceCategoryId,
      });
      this.reordering = true;
      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  submitOrder() {
    this.reorderResources.onSubmit();
  }

  cancelReordering() {
    this.reordering = false;
  }
}
