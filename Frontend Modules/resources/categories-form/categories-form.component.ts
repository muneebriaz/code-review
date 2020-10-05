import {
  Component,
  EventEmitter,
  Output,
  Input,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NgForm } from "@angular/forms";
import { CropperSettings, ImageCropperComponent } from "ng2-img-cropper";

import { AlertService } from "app/shared/services/alert.service";
import { ToastrService } from "ngx-toastr";
import { AppConstants } from "app/shared/constants";
import { ResourceCategory } from "app/shared/classes/resource-category.interface";
import { ImageCropperConfig } from "app/shared/classes/image-cropper.class";
import { PhotoService } from "app/shared/services/photo.service";

@Component({
  selector: "app-resource-categories-form",
  styleUrls: ["./categories-form.component.scss"],
  templateUrl: "./categories-form.component.html",
})
export class CategoriesFormComponent {
  @Input() resourceCategory: ResourceCategory = {};

  @Output() createResource = new EventEmitter<ResourceCategory>();
  @Output() updateResource = new EventEmitter<ResourceCategory>();

  @ViewChild("f", { static: false }) form: NgForm;
  isFormSubmitted: Boolean = false;

  loading: boolean = false;
  resourceId: string;
  edit: boolean = false;
  participantTypes = AppConstants.PARTICIPANT_TYPES;

  //attributes related to image upload
  data: any = { image: "" };
  file: File;
  previous: File;
  imageChange: Boolean = false;
  imageUrl: string = "";
  uploadUrl: string = "";
  cropperSettings: CropperSettings;
  @ViewChild("cropper", undefined)
  cropper: ImageCropperComponent;

  required_field_Error = AppConstants.DEFAULT_REQUIRED_FIELD_ERROR;
  ERROR_REQUIRED_FIELDS = AppConstants.ERROR_REQUIRED_FIELDS;

  constructor(
    private alert: AlertService,
    private _route: ActivatedRoute,
    private toastr: ToastrService,
    private photoService: PhotoService,
  ) {
    //cropper initialization
    this.cropperSettings = new ImageCropperConfig().cropperSettings;
    this.resourceCategory.applicable = AppConstants.PARTICIPANT_TYPES.PRIMARY;
    this.resourceId = this._route.snapshot.params["resourceCategoryId"];
  }

  dataURItoBlob(dataURI) {
    var binary = window.atob(dataURI.split(",")[1]);
    var array = [];
    for (var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: "image/jpeg" });
  }

  async fileChangeListener($event) {
    try {
      let image: any = new Image();
      this.file = $event.target.files[0];
      if ($event.target.files.length === 0) this.file = this.previous;
      if (this.file && this.file.type.includes("image")) {
        let response = await this.photoService.getImageUrl();

        this.imageChange = true;
        this.uploadUrl = response["uploadUrl"];
        this.imageUrl = response["url"];
        this.previous = this.file;
        let myReader: FileReader = new FileReader();
        let that = this;
        myReader.onloadend = (loadEvent: any) => {
          image.src = loadEvent.target.result;
          that.cropper.setImage(image);
        };
        myReader.readAsDataURL(this.file);
      } else {
        this.file = undefined;
        return this.alert.error("Choose a valid image file.");
      }
    } catch (err) {
      return this.alert.error(err);
    }
  }

  async formSubmitted() {
    try {
      this.isFormSubmitted = true;
      if (this.form.invalid || (!this.resourceCategory.picture && !this.file)) {
        return this.alert.error(this.ERROR_REQUIRED_FIELDS);
      }
      if (this.imageChange) {
        await this.photoService.putImageUrl(this.uploadUrl, {
          image: this.dataURItoBlob(this.data.image),
        });
        this.resourceCategory.picture = this.imageUrl;
        this.file = undefined;
      }
      if (this.resourceCategory.name) {
        this.resourceCategory.name = this.resourceCategory.name.trim();
      }

      if (this.resourceId) {
        this.updateResource.emit(this.resourceCategory);
        this.edit = false;
      } else {
        this.createResource.emit(this.resourceCategory);
      }
    } catch (err) {
      return this.alert.error(err);
    }
  }
}
