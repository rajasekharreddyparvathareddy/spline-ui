/*
 * Copyright (c) 2020 ABSA Group Limited
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

import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, map, skip, takeUntil, tap } from 'rxjs/operators'

import { BaseComponent } from '../../common'


@Component({
    selector: 'spline-search-box',
    templateUrl: './spline-search-box.component.html',
})
export class SplineSearchComponent extends BaseComponent {

    @ViewChild('inputRef', { read: ElementRef, static: true }) inputRef: ElementRef<HTMLElement>;

    @Input() placeholder = 'Search'

    @Input() set searchTerm(value: string) {
        this.inputValue = value
    }

    @Output() search$ = new EventEmitter<string>()

    isFocused = false
    inputValue: string

    readonly emitSearchEventDebounceTimeInUs = 200

    protected searchValueChanged$ = new Subject<string>()

    constructor() {
        super()

        this.searchValueChanged$
            .pipe(
                takeUntil(this.destroyed$),
                // skip default value
                // skip(1),
                map(val => val.trim().toLowerCase()),
                // wait 200 us between keyUp events
                debounceTime(this.emitSearchEventDebounceTimeInUs),
                // emit only different value form the previous one
                distinctUntilChanged(),
            )
            .subscribe(
                value => this.search$.emit(value),
            )
    }

    onSearchChanged(searchTerm: string): void {
        this.inputValue = searchTerm
        this.searchValueChanged$.next(searchTerm)
    }

    onClearBtnClicked(): void {
        this.inputValue = ''
        this.focusSearchInput()
    }

    focusSearchInput(): void {
        this.inputRef.nativeElement.focus()
    }

}
