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

import { ExecutionPlan } from 'spline-api'
import { SdWidgetCard, SdWidgetSimpleRecord, SplineColors, SplineDataViewSchema } from 'spline-common'


export namespace ExecutionPlanInfo {

    export function toDataViewSchema(data: ExecutionPlan): SplineDataViewSchema {
        return [
            SdWidgetCard.toSchema(
                {
                    color: SplineColors.ORANGE,
                    icon: 'playlist_play',
                    title: data?.extraInfo?.appName ? data?.extraInfo?.appName : 'EVENTS.EXECUTION_EVENT_INFO__DEFAULT_NAME',
                    label: 'EVENTS.EXECUTION_EVENT_INFO__LABEL',
                },
                [
                    SdWidgetSimpleRecord.toSchema([
                        {
                            label: 'EVENTS.EXECUTION_EVENT_INFO__DETAILS__SYSTEM_INFO',
                            value: `${data.systemInfo.name} ${data.systemInfo.version}`,
                        },
                        {
                            label: 'EVENTS.EXECUTION_EVENT_INFO__DETAILS__AGENT_INFO',
                            value: `${data.agentInfo.name} ${data.agentInfo.version}`,
                        },
                    ]),
                ],
            ),
        ]
    }
}
