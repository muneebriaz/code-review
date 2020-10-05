import { NgModule } from "@angular/core";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ImageCropperModule } from "ng2-img-cropper";
import { QuillModule } from "ngx-quill";

import { ResourcesRoutingModule } from "./resources-routing.module";
import { CategoriesFormComponent } from "./categories-form/categories-form.component";
import { CategoriesTableComponent } from "./categories-table/categories-table.component";
import { CategoriesListingComponent } from "./categories-listing/categories-listing.component";
import { CategoriesCreateComponent } from "./categories-create/categories-create.component";
import { CategoriesUpdateComponent } from "./categories-update/categories-update.component";
import { ResourcesFormComponent } from "./categories-listing/resources-form/resources-form.component";
import { ResourcesCreateComponent } from "./categories-listing/resources-create/resources-create.component";
import { ResourcesUpdateComponent } from "./categories-listing/resources-update/resources-update.component";
import { ResourcesListingComponent } from "./categories-listing/resources-listing/resources-listing.component";

import { PhotoService } from "app/shared/services/photo.service";
import { ResourcesService } from "app/shared/services/resources.service";
import { SharedModule } from "app/shared/shared.module";
import { ParticipantsService } from "app/shared/services/participants.service";
import { ReorderCategoriesComponent } from "./reorder-categories/reorder-categories.component";
import { DragulaModule } from "ng2-dragula";
import { ReorderResourcesComponent } from "./categories-listing/reorder-resources/reorder-resources.component";
import { PreviewResourceComponent } from "./categories-listing/resources-form/preview-resource/preview-resource.component";

@NgModule({
  imports: [
    NgbModule,
    FormsModule,
    CommonModule,
    SharedModule,
    ResourcesRoutingModule,
    ImageCropperModule,
    QuillModule,
    DragulaModule,
  ],
  declarations: [
    CategoriesFormComponent,
    CategoriesTableComponent,
    CategoriesListingComponent,
    CategoriesCreateComponent,
    CategoriesUpdateComponent,
    ResourcesFormComponent,
    ResourcesCreateComponent,
    ResourcesUpdateComponent,
    ResourcesListingComponent,
    ReorderCategoriesComponent,
    ReorderResourcesComponent,
    PreviewResourceComponent,
  ],
  providers: [PhotoService, ResourcesService, ParticipantsService],
  entryComponents: [PreviewResourceComponent],
})
export class ResourcesModule {}
