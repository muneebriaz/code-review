import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { Subscription } from "rxjs";

import { AlertService } from "app/shared/services/alert.service";
import { AppConstants } from "app/shared/constants";
import { ResourceCategory } from "app/shared/classes/resource-category.interface";
import { DragulaService } from "ng2-dragula";
import { ResourceCategoryService } from "app/shared/services/resource-category.service";

@Component({
  selector: "app-reorder-categories",
  templateUrl: "./reorder-categories.component.html",
  styleUrls: ["./reorder-categories.component.scss"],
})
export class ReorderCategoriesComponent {
  @Input() loading: boolean = false;
  @Input() resourceCategories: Array<ResourceCategory> = [];
  @Output() cancelReordering = new EventEmitter<any>();
  @Output() saveChanges = new EventEmitter<any>();
  DRAGDROP_ID: string = "categories";

  constructor(
    private resourceCategoryService: ResourceCategoryService,
    private alert: AlertService,
  ) {}

  async onSubmit() {
    try {
      this.loading = true;
      const response = await this.resourceCategoryService.updateCategoriesOrder(
        { categories: this.resourceCategories.map((c) => c._id) },
      );
      this.saveChanges.emit();
      this.alert.success(response);
      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  cancel() {
    this.cancelReordering.emit();
  }
}
