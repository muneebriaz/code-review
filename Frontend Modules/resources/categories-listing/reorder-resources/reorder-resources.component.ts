import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Subscription } from "rxjs";

import { AlertService } from "app/shared/services/alert.service";
import { AppConstants } from "app/shared/constants";
import { Resource } from "app/shared/classes/resource.interface";
import { DragulaService } from "ng2-dragula";
import { ResourcesService } from "app/shared/services/resources.service";
import autoScroll from 'dom-autoscroller';

@Component({
  selector: "app-reorder-resources",
  templateUrl: "./reorder-resources.component.html",
  styleUrls: ["./reorder-resources.component.scss"],
})
export class ReorderResourcesComponent {
  @Input() loading: boolean = false;
  @Input() resources: Array<Resource> = [];
  @Input() categoryId: string;
  @Output() cancelReordering = new EventEmitter<any>();
  @Output() saveChanges = new EventEmitter<any>();
  DRAGDROP_ID: string = "resources";
  @ViewChild("autoscroll2", undefined) autoscroll2: ElementRef;

  constructor(
    private resourceService: ResourcesService,
    private alert: AlertService,
  ) {}

  async onSubmit() {
    try {
      this.loading = true;
      const response = await this.resourceService.reorderResource({
        resources: this.resources.map((c) => c._id),
      });
      this.saveChanges.emit();
      this.alert.success(response);
      this.loading = false;
    } catch (err) {
      this.loading = false;
      return this.alert.error(err);
    }
  }

  ngAfterViewInit() {
    autoScroll([
      this.autoscroll2.nativeElement
    ], {
        margin: 20,
        maxSpeed: 5,
        scrollWhenOutside: true,
        autoScroll() {
          return this.down;
        }
      });
  }

  cancel() {
    this.cancelReordering.emit();
  }
}
