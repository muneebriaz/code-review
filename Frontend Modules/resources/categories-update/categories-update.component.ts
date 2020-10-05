import { Component } from "@angular/core";
import { ResourceCategory } from "app/shared/classes/resource-category.interface";
import { ActivatedRoute } from "@angular/router";

import { ResourceCategoryService } from "app/shared/services/resource-category.service";
import { AlertService } from "app/shared/services/alert.service";
import { selectRowsBetween } from "@swimlane/ngx-datatable/release/utils";

@Component({
  selector: "app-resource-categories-update",
  styleUrls: ["./categories-update.component.scss"],
  templateUrl: "./categories-update.component.html",
})
export class CategoriesUpdateComponent {
  loading: boolean = false;
  resourceCategoryId: string;
  resourceCategory: ResourceCategory = {};
  edit: boolean = false;

  constructor(
    private resourceCategoryService: ResourceCategoryService,
    private alert: AlertService,
    private _route: ActivatedRoute,
  ) {
    this.resourceCategoryId = this._route.snapshot.params["resourceCategoryId"];
    this.getResourceCategory();
  }

  async getResourceCategory() {
    try {
      this.loading = true;
      let response = await this.resourceCategoryService.getResourceCategory(
        this.resourceCategoryId,
      );
      this.resourceCategory = response["resourceCategory"];
      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  async updateResourceCategory(resourceCategory: ResourceCategory) {
    try {
      this.loading = true;

      const response = await this.resourceCategoryService.updateResourceCategory(
        this.resourceCategoryId,
        resourceCategory,
      );
      this.alert.success(response);

      this.loading = false;
    } catch (err) {
      return this.alert.error(err);
    }
  }

  back() {
    window.history.back();
  }
}
