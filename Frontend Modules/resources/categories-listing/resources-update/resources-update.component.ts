import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ResourcesService } from "app/shared/services/resources.service";
import { AlertService } from "app/shared/services/alert.service";
import { Resource } from "app/shared/classes/resource.interface";

@Component({
  selector: "app-resources-update",
  styleUrls: ["./resources-update.component.scss"],
  templateUrl: "./resources-update.component.html",
})
export class ResourcesUpdateComponent {
  loading: boolean = false;
  resourceId: string;
  resource: Resource = {};
  constructor(
    private alert: AlertService,
    private resourceService: ResourcesService,
    private _route: ActivatedRoute,
  ) {
    this.resourceId = this._route.snapshot.params["resourceId"];
    this.getResource();
  }
  async getResource() {
    try {
      this.loading = true;
      let response = await this.resourceService.getResource(this.resourceId);
      this.resource = response["resource"];
      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  async updateResource(resource: Resource) {
    try {
      this.loading = true;
      const {
        type,
        location,
        headline,
        media,
        viewTime,
        isLocationSpecific,
        resourceContent,
      } = resource;
      const response = await this.resourceService.updateResource(
        this.resourceId,
        {
          type,
          location,
          headline,
          media,
          viewTime,
          isLocationSpecific,
          resourceContent,
        },
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
