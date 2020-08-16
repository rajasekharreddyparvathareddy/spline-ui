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

import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, NavigationEnd, NavigationExtras, Router } from '@angular/router'
import _ from 'lodash'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { filter, map, shareReplay, skip, takeUntil, withLatestFrom } from 'rxjs/operators'
import { ExecutionPlanFacade } from 'spline-api'
import { SgData, SgNodeSchema, SplineDataViewSchema } from 'spline-common'
import { BaseComponent } from 'spline-utils'

import { ExecutionPlanNodeControl, ExecutionPlanOverview, OperationInfo, SgRelations } from '../../models'
import { ExecutionPlanOverviewStore, ExecutionPlanOverviewStoreFacade } from '../../store'
import QueryParamAlis = ExecutionPlanOverview.QueryParamAlis


@Component({
    selector: 'event-plan-overview-page',
    templateUrl: './plan-overview.page.component.html',
    styleUrls: ['./plan-overview.page.component.scss'],
    providers: [
        {
            provide: ExecutionPlanOverviewStoreFacade,
            useFactory: (executionPlanFacade: ExecutionPlanFacade) => {
                return new ExecutionPlanOverviewStoreFacade(executionPlanFacade)
            },
            deps: [ExecutionPlanFacade],
        },
    ],
})
export class PlanOverviewPageComponent extends BaseComponent implements OnInit {

    readonly selectedNodeViewSchema$: Observable<SplineDataViewSchema>
    readonly graphData$: Observable<SgData>
    readonly focusNode$ = new Subject<string>()
    readonly highlightedRelationsNodesIds$ = new BehaviorSubject<string[]>([])

    eventId: string

    constructor(private readonly activatedRoute: ActivatedRoute,
                private readonly router: Router,
                readonly store: ExecutionPlanOverviewStoreFacade) {
        super()

        this.selectedNodeViewSchema$ = this.store.selectedNode$
            .pipe(
                map(selectedNode => selectedNode ? OperationInfo.toDataViewSchema(selectedNode) : null),
            )

        this.graphData$ = this.store.loadingProcessingEvents.success$
            .pipe(
                takeUntil(this.destroyed$),
                map(state => {
                    // select all nodes list from the store
                    const nodesList = ExecutionPlanOverviewStore.selectAllNodes(state)
                    return {
                        links: state.links,
                        nodes: nodesList
                            // map node source data to the SgNode schema
                            .map(
                                nodeSource => ExecutionPlanNodeControl.toSgNode(
                                    nodeSource,
                                    (nodeId) => this.onNodeHighlightRelations(nodeId),
                                ),
                            ),
                    }
                }),
                shareReplay(1),
            )

        //
        // [ACTION] :: ATTRIBUTE SELECTED
        //      => reset node highlights
        //
        this.store.selectedAttribute$
            .pipe(
                takeUntil(this.destroyed$),
                filter(attribute => !!attribute && this.highlightedRelationsNodesIds$.getValue().length > 0),
            )
            .subscribe(
                () => this.resetNodeHighlightRelations(),
            )

        //
        // [ACTION] :: HIGHLIGHTED RELATION CHANGE
        //      => reset selected attribute
        //
        this.highlightedRelationsNodesIds$
            .pipe(
                takeUntil(this.destroyed$),
                filter(highlightedRelationsNodesIds => highlightedRelationsNodesIds.length > 0),
                withLatestFrom(this.store.selectedAttribute$),
                filter(([highlightedRelationsNodesIds, selectedAttribute]) => !!selectedAttribute),
            )
            .subscribe(
                () => this.onSelectedAttributeChanged(null),
            )

    }

    ngOnInit(): void {

        const routerState = ExecutionPlanOverview.extractRouterState(this.activatedRoute)
        this.eventId = routerState[QueryParamAlis.ExecutionEventId]

        // init store state
        this.store.init(
            routerState[QueryParamAlis.ExecutionPlanId],
            routerState[QueryParamAlis.SelectedNodeId],
            routerState[QueryParamAlis.SelectedAttributeId],
        )

        this.watchStoreStateChanges()
        this.watchUrlChanges()
    }

    onNodeSelected($event: { nodeSchema: SgNodeSchema | null }): void {
        this.store.setSelectedNode($event.nodeSchema ? $event.nodeSchema.id : null)
    }

    onShowEpDetailsBtnCLicked(): void {
        this.store.setSelectedNode(null)
    }

    onSelectedAttributeChanged(attributeId: string | null): void {
        this.store.setSelectedAttribute(attributeId)
    }

    private resetNodeHighlightRelations(): void {
        this.highlightedRelationsNodesIds$.next([])
    }

    private onNodeHighlightRelations(nodeId: string): void {
        const highlightedRelationsNodesIds = SgRelations.toggleSelection(
            this.highlightedRelationsNodesIds$.getValue(),
            nodeId,
            this.store.state.links,
        )

        this.highlightedRelationsNodesIds$.next(highlightedRelationsNodesIds)
    }

    // Watch Store State changes => update Router State if needed
    private watchStoreStateChanges(): void {
        //
        // [ACTION] :: SELECTED NODE CHANGE
        //      => update query params
        //
        this.store.selectedNode$
            .pipe(
                skip(1),
                takeUntil(this.destroyed$),
                map(selectedNode => selectedNode ? selectedNode.id : null),
                filter(selectedNodeId => {
                    const nodeId = ExecutionPlanOverview.getSelectedNodeId(this.activatedRoute)
                    return selectedNodeId !== nodeId
                }),
            )
            .subscribe(selectedNodeId =>
                this.updateQueryParams(ExecutionPlanOverview.QueryParamAlis.SelectedNodeId, selectedNodeId)
            )

        //
        // [ACTION] :: SELECTED ATTRIBUTE CHANGE
        //      => update query params
        //
        this.store.selectedAttribute$
            .pipe(
                skip(1),
                takeUntil(this.destroyed$),
                map(selectedAttribute => selectedAttribute ? selectedAttribute.id : null),
                filter(selectedAttributeId => {
                    const attrId = ExecutionPlanOverview.getSelectedAttributeId(this.activatedRoute)
                    return selectedAttributeId !== attrId
                }),
            )
            .subscribe(attrId =>
                this.updateQueryParams(ExecutionPlanOverview.QueryParamAlis.SelectedAttributeId, attrId)
            )
    }

    // Watch Router State changes => update Store State if needed
    private watchUrlChanges(): void {
        this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntil(this.destroyed$),
            )
            .subscribe(() => {

                const routerState = ExecutionPlanOverview.extractRouterState(this.activatedRoute)
                this.eventId = routerState[QueryParamAlis.ExecutionEventId]

                // reinitialize store state in case of new ExecutionPlan ID
                if (routerState[QueryParamAlis.ExecutionPlanId] !== this.store.state.executionPlanId) {
                    this.store.init(
                        routerState[QueryParamAlis.ExecutionPlanId],
                        routerState[QueryParamAlis.SelectedNodeId],
                        routerState[QueryParamAlis.SelectedAttributeId],
                    )
                }
                else {
                    this.store.setSelectedNode(routerState[QueryParamAlis.SelectedNodeId])
                    this.store.setSelectedAttribute(routerState[QueryParamAlis.SelectedAttributeId])
                }
            })
    }

    private updateQueryParams(paramName: string, value: string | null, replaceUrl: boolean = true): void {

        const queryParams = value
            ? {
                ...this.activatedRoute.snapshot.queryParams,
                [paramName]: value,
            }
            : _.omit(this.activatedRoute.snapshot.queryParams, paramName)

        const extras: NavigationExtras = {
            queryParams,
            relativeTo: this.activatedRoute,
            replaceUrl,
        }

        this.router.navigate([], extras)
    }

}
