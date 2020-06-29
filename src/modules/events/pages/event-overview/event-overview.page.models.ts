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

import { ExecutionEventLineageNode, ExecutionEventLineageOverview } from 'spline-api'
import { SplineLineageGraph } from 'spline-common'

import { EventInfo } from '../../components'


export namespace EventOverviewPage {

    export type Data = {
        graphData: SplineLineageGraph.GraphData<ExecutionEventLineageNode>
        eventInfo: EventInfo.Data
    }


    export function toData(executionEventId: string, lineageOverview: ExecutionEventLineageOverview): Data {
        const targetEdge = lineageOverview.lineage.transitions
            .find(
                x => x.targetNodeId === lineageOverview.executionEventInfo.targetDataSourceId,
            )
        const eventNode = targetEdge
            ? lineageOverview.lineage.nodes.find(x => x.id === targetEdge.sourceNodeId)
            : undefined


        return {
            graphData: {
                nodes: lineageOverview.lineage.nodes
                    .map(node => ({
                        data: {
                            ...node,
                            name: node.name.split('/').slice(-1)[0],
                        },
                    })),
                edges: lineageOverview.lineage.transitions
                    .map(transition => ({
                        data: {
                            target: transition.targetNodeId,
                            source: transition.sourceNodeId,
                        },
                    })),
            },
            eventInfo: {
                id: executionEventId,
                name: eventNode ? eventNode.name : 'NaN',
                applicationId: lineageOverview.executionEventInfo.applicationId,
                executedAt: new Date(lineageOverview.executionEventInfo.timestamp)
            },
        }
    }
}