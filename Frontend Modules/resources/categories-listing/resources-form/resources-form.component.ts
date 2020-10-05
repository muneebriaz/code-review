import {
  Component,
  ViewChild,
  EventEmitter,
  Output,
  Input,
  OnChanges,
} from "@angular/core";
import { QuillEditorComponent } from "ngx-quill/src/quill-editor.component";
import { NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";

import { Resource } from "app/shared/classes/resource.interface";
import { Location } from "app/shared/classes/location.interface";
import { AppConstants } from "app/shared/constants";
import { AlertService } from "app/shared/services/alert.service";
import {} from "app/shared/services/photo.service";
import { ParticipantsService } from "app/shared/services/participants.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ImageUploadComponent } from "app/shared/generic/image-upload/image-upload.component";
import { PreviewResourceComponent } from "./preview-resource/preview-resource.component";
import { ResourcesService } from "app/shared/services/resources.service";
import { UtilityService } from "app/shared/services/utility.service";

@Component({
  selector: "app-resources-form",
  styleUrls: ["./resources-form.component.scss"],
  templateUrl: "./resources-form.component.html",
})
export class ResourcesFormComponent implements OnChanges {
  @Input() resource: Resource = {
    headline: "",
    viewTime: 5,
    location: "",
    resourceContent: [{ type: "paragraph", value: "" }],
  };
  @Output() createResource = new EventEmitter<Resource>();
  @Output() updateResource = new EventEmitter<Resource>();
  resourceId: string;
  loading: boolean = false;
  locations: Array<Location> = [];
  isDataLoaded: boolean = false;
  resourceTypes = AppConstants.RESOURCE_TYPES;

  @ViewChild("f", { static: false }) form: NgForm;
  isFormSubmitted: Boolean = false;

  imageUrl: string = "";
  uploadUrl: string = "";
  videoUrl: string = "";

  required_field_Error = AppConstants.DEFAULT_REQUIRED_FIELD_ERROR;
  ERROR_REQUIRED_FIELDS = AppConstants.ERROR_REQUIRED_FIELDS;
  INCORRECT_VIEW_TIME = AppConstants.INCORRECT_VIEW_TIME;
  RESOURCE_CONTENT_TYPES = AppConstants.RESOURCE_CONTENT_TYPES;
  modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ header: [1, 2, 3, 4, 5, 6] }],
      [{ align: [] }],
      ["link"],
    ],
  };
  constructor(
    private alert: AlertService,
    private _route: ActivatedRoute,
    private participantService: ParticipantsService,
    private modalService: NgbModal,
    private resourceService: ResourcesService,
    private utilityService: UtilityService,
  ) {
    this.resource.type = AppConstants.RESOURCE_TYPES.VIDEO;
    this.resource.category = this._route.snapshot.params["resourceCategoryId"];
    this.resourceId = this._route.snapshot.params["resourceId"];
    this.getLocation();
  }

  ngOnChanges() {
    if (!this.resource.location) {
      this.resource.location = "";
    }
  }

  changeResourceType(resourceType) {
    if (resourceType === this.resourceTypes.ARTICLE) {
      this.videoUrl = this.resource.media;
      this.resource.media = "";
    } else {
      this.resource.media = this.videoUrl;
    }
  }

  async getLocation() {
    try {
      let response = await this.participantService.getLocations();
      this.locations = response["locations"];
      this.locations.unshift({
        name: AppConstants.NOT_LOCATION_SPECIFIC,
        _id: "",
      });

      this.isDataLoaded = true;
    } catch (err) {
      return this.alert.error(err);
    }
  }

  async openMediaModal($event) {
    const modalRef = this.modalService.open(ImageUploadComponent, {
      backdrop: "static",
    });
    modalRef.componentInstance.fileEvent = $event
    modalRef.componentInstance.onSuccess.subscribe((image: string) => {
      this.resource.media = image;
    });
  }

  async formSubmitted() {
    try {
      this.isFormSubmitted = true;
      if (this.form.invalid) {
        return this.alert.error(this.ERROR_REQUIRED_FIELDS);
      }
      for (const rc of this.resource.resourceContent) {
        if (!rc.value)
          return this.alert.error(`Required field '${rc.type}' is missing`);
      }
      this.resource.isLocationSpecific = !!this.resource.location;
      if (this.resource.viewTime <= 0) {
        return this.alert.error(this.INCORRECT_VIEW_TIME);
      }
      if (this.resourceId) {
        this.updateResource.emit(this.resource);
      } else {
        this.createResource.emit(this.resource);
      }
    } catch (err) {
      return this.alert.error(err);
    }
  }

  setFocus($event) {
    $event.focus();
  }

  addResourceContent(type, index, isEdit, $event) {
    if (type === this.RESOURCE_CONTENT_TYPES.IMAGE) {
      this.openUploadImageModal(index, isEdit, $event);
    } else if (type === this.RESOURCE_CONTENT_TYPES.PARAGRAPH)
      this.resource.resourceContent.splice(index + 1, 0, {
        type,
        value: "",
      });
  }

  openUploadImageModal(index, isEdit, $event) {
    const modalRef = this.modalService.open(ImageUploadComponent, {
      backdrop: "static",
    });
    modalRef.componentInstance.fileEvent = $event
    modalRef.componentInstance.onSuccess.subscribe((image: string) => {
      if (isEdit)
        this.resource.resourceContent[index] = {
          type: this.RESOURCE_CONTENT_TYPES.IMAGE,
          value: image,
        };
      else
        this.resource.resourceContent.splice(index + 1, 0, {
          type: this.RESOURCE_CONTENT_TYPES.IMAGE,
          value: image,
        });
    });
  }

  previewResource() {
    const modalRef = this.modalService.open(PreviewResourceComponent);
    modalRef.componentInstance.resource = this.resource;
    if (this.resource && this.resource.type === this.resourceTypes.VIDEO) {
      modalRef.componentInstance.safeURL = this.utilityService.sanitizingLinks(
        this.resource.media,
      );
    }
  }

  removeItem(index) {
    this.resource.resourceContent.splice(index, 1);
  }
}
