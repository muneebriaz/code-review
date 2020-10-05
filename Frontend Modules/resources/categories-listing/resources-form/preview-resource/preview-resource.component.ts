import { Component, OnInit, Input } from "@angular/core";

import { AlertService } from "../../../../shared/services/alert.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AppConstants } from "app/shared/constants";
import { ResourcesService } from "app/shared/services/resources.service";

@Component({
  selector: "app-preview-resource",
  templateUrl: "./preview-resource.component.html",
  styleUrls: ["./preview-resource.component.scss"],
})
export class PreviewResourceComponent {
  resource: any;
  CONTENT_TYPES: any = AppConstants.RESOURCE_CONTENT_TYPES;
  RESOURCE_TYPES: any = AppConstants.RESOURCE_TYPES;
  safeURL: any;
  constructor(
    private alert: AlertService,
    private activeModal: NgbActiveModal,
    private resourceService: ResourcesService,
  ) {}

  close() {
    this.activeModal.close();
  }
}
