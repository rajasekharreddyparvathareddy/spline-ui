/*
 * Copyright 2020 ABSA Group Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatTreeModule } from '@angular/material/tree'
import { SD_WIDGET_FACTORY, SplineTranslateModule } from 'spline-common'

import { SplineAttributesModule } from '../attributes'

import * as fromComponents from './components'
import { SdWidgetAttributesTreeFactory } from './services/sd-widget-attributes-tree.factory'


@NgModule({
    imports: [
        CommonModule,
        MatCardModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        SplineAttributesModule,
        SplineTranslateModule,
    ],
    declarations: [
        ...fromComponents.attributesTreeComponents,
    ],
    exports: [
        ...fromComponents.attributesTreeComponents,
    ],
    providers: [
        SdWidgetAttributesTreeFactory,
        {
            provide: SD_WIDGET_FACTORY,
            useValue: SdWidgetAttributesTreeFactory,
            multi: true,
        }
    ]
})
export class SplineAttributesTreeModule { }
