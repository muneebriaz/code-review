import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { AlertService } from "app/shared/services/alert.service";
import { ResourceCategory } from "app/shared/classes/resource-category.interface";
import { ResourceCategoryService } from "app/shared/services/resource-category.service";

@Component({
  selector: "app-categories-create",
  styleUrls: ["./categories-create.component.scss"],
  templateUrl: "./categories-create.component.html",
})
export class CategoriesCreateComponent {
  loading: boolean = false;

  constructor(
    private alert: AlertService,
    private resourceCategoryService: ResourceCategoryService,
    private router: Router,
  ) {}

  async submitted(resource: ResourceCategory) {
    try {
      this.loading = true;
      const response = await this.resourceCategoryService.createResourceCategory(
        resource,
      );
      this.alert.success(response);
      this.router.navigate(["resource-categories/listing"]);

      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  back() {
    window.history.back();
  }
}
