import { Component, Input, Output, EventEmitter } from "@angular/core";
import { NgbPaginationConfig } from "@ng-bootstrap/ng-bootstrap";

import { AppConstants } from "app/shared/constants";
import { PaginationConfig } from "app/shared/configs/pagination.config";
import { Pagination } from "app/shared/classes/pagination.class";
import { ResourceCategory } from "app/shared/classes/resource-category.interface";
import { confirmCancelButton } from "app/shared/data/sweet-alerts";

@Component({
  selector: "app-categories-table",
  styleUrls: ["./categories-table.component.scss"],
  templateUrl: "./categories-table.component.html",
})
export class CategoriesTableComponent {
  @Input() loading: boolean = false;
  @Input() resourceCategories: Array<ResourceCategory> = [];
  @Output() page = new EventEmitter<number>();
  @Output() resourceCategoryId = new EventEmitter<string>();
  deleteMessage = AppConstants.DELETE_MESSAGE;
  pagination = new Pagination();
  pgConfig: NgbPaginationConfig = new NgbPaginationConfig();

  constructor(private paginationConfig: PaginationConfig) {
    this.pgConfig = this.paginationConfig.getConfig();
  }

  initializePagination(response) {
    this.pagination.autoInitialize(response);
  }

  changePage(page: number) {
    this.page.emit(page);
  }

  async delete(id: string) {
    let response = await confirmCancelButton(
      this.deleteMessage.question,
      this.deleteMessage.message,
      this.deleteMessage.type,
    );
    if (response === true) this.resourceCategoryId.emit(id);
  }
}
