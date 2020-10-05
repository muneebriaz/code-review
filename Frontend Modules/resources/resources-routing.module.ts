import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CategoriesListingComponent } from './categories-listing/categories-listing.component';
import { CategoriesCreateComponent } from './categories-create/categories-create.component';
import { CategoriesUpdateComponent } from './categories-update/categories-update.component';
import { ResourcesListingComponent } from './categories-listing/resources-listing/resources-listing.component';
import { ResourcesUpdateComponent } from './categories-listing/resources-update/resources-update.component';
import { ResourcesCreateComponent } from './categories-listing/resources-create/resources-create.component';

const routes: Routes = [
  {
    path: 'listing',
    component: CategoriesListingComponent,
    data: {
      title: 'Resources categories listing'
    }
  },
  {
    path: 'create',
    component: CategoriesCreateComponent,
    data: {
      title: 'Resource category create'
    }
  },
  {
    path: ':resourceCategoryId',
    component: CategoriesUpdateComponent,
    data: {
      title: 'Resource category upadte'
    }
  },
  {
    path: ':resourceCategoryId/resources',
    component: ResourcesListingComponent,
    data: {
      title: 'Resources listing'
    }
  },
  {
    path: ':resourceCategoryId/resources/create',
    component: ResourcesCreateComponent,
    data: {
      title: 'Resources create'
    }
  },
  {
    path: ':resourceCategoryId/resources/:resourceId',
    component: ResourcesUpdateComponent,
    data: {
      title: 'Resources update'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesRoutingModule {}
