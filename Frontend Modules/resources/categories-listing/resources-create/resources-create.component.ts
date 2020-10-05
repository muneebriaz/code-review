import { Component } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Resource } from "app/shared/classes/resource.interface";

import { ToastrService } from "ngx-toastr";
import { ResourcesService } from "app/shared/services/resources.service";
import { AlertService } from "app/shared/services/alert.service";

@Component({
  selector: "app-resource-creaate",
  styleUrls: ["./resources-create.component.scss"],
  templateUrl: "./resources-create.component.html",
})
export class ResourcesCreateComponent {
  loading: boolean = false;
  categoryId: string;

  constructor(
    private alert: AlertService,
    private resourceService: ResourcesService,
    private toastr: ToastrService,
    private router: Router,
    private _route: ActivatedRoute,
  ) {
    this.categoryId = this._route.snapshot.params["resourceCategoryId"];
  }

  async submitted(resource: Resource) {
    try {
      this.loading = true;
      const response = await this.resourceService.createResource(resource);
      this.toastr.success("", response["message"]);
      this.loading = false;
      this.router.navigate([
        `resource-categories/${this.categoryId}/resources`,
      ]);
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  back() {
    window.history.back();
  }
}
