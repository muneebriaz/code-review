import { Component, ViewChild } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";

import { ResourceCategoryService } from "app/shared/services/resource-category.service";
import { ResourceCategory } from "app/shared/classes/resource-category.interface";
import { AlertService } from "app/shared/services/alert.service";

@Component({
  selector: "app-categories-listing",
  styleUrls: ["./categories-listing.component.scss"],
  templateUrl: "./categories-listing.component.html",
})
export class CategoriesListingComponent {
  search = "";
  loading: boolean = false;
  reordering: boolean = false;
  resourceCategories: Array<ResourceCategory> = [];
  @ViewChild("categoriesTable", { static: false }) categoriesTable: any;
  @ViewChild("reorderResources", { static: false }) reorderResources: any;
  DRAGDROP_TEXT: string = "Drag & drop to set the order";
  LISTING_TEXT: string = "Resource Categories List";
  constructor(
    private alert: AlertService,
    private activatedRoute: ActivatedRoute,
    private resourceCategoryService: ResourceCategoryService,
  ) {
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.search = params["search"];
      this.getResourceCategories(this.search ? 1 : undefined);
    });
  }

  async getResourceCategories(page?: number) {
    try {
      this.loading = true;
      let response = await this.resourceCategoryService.getResourceCategoriesListing(
        { page, search: this.search },
      );
      this.resourceCategories = response["resourceCategories"];
      this.categoriesTable.initializePagination(response);
      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  async deleteResourceCategory(id: string) {
    try {
      this.loading = true;

      const response = await this.resourceCategoryService.deleteResourceCategory(
        id,
      );
      this.getResourceCategories();
      this.alert.success(response);

      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  async allowReordering() {
    try {
      this.loading = true;
      this.resourceCategories = await this.resourceCategoryService.getAllResourceCategories(
        { applicable: "" },
      );
      this.reordering = true;
      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  saveReordering() {
    this.reorderResources.onSubmit();
  }

  cancelReordering() {
    this.getResourceCategories();
    this.reordering = false;
  }
}
