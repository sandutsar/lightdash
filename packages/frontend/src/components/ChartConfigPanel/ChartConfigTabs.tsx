import { InputGroup, Tab, Tabs } from '@blueprintjs/core';
import {
    ChartType,
    fieldId,
    getAxisName,
    getDefaultSeriesColor,
    getDimensions,
    getItemId,
    getItemLabel,
    getMetrics,
    getSeriesId,
    isField,
    Metric,
    TableCalculation,
} from 'common';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useVisualizationContext } from '../LightdashVisualization/VisualizationProvider';
import { InputWrapper, Wrapper } from './ChartConfigPanel.styles';
import FieldLayoutOptions from './FieldLayoutOptions';
import BasicSeriesConfiguration from './Series/BasicSeriesConfiguration';
import GroupedSeriesConfiguration from './Series/GroupedSeriesConfiguration';

const ChartConfigTabs: FC = () => {
    const {
        explore,
        chartType,
        resultsData,
        cartesianConfig: {
            dirtyLayout,
            dirtyEchartsConfig,
            updateSingleSeries,
            updateAllGroupedSeries,
            setXAxisName,
            setYAxisName,
        },
        pivotDimensions,
    } = useVisualizationContext();
    const pivotDimension = pivotDimensions?.[0];

    const [tab, setTab] = useState<string | number>('layout');
    const isBigNumber = chartType === ChartType.BIG_NUMBER;

    useEffect(() => {
        if (isBigNumber) {
            setTab('axes');
        }
    }, []);

    const dimensionsInMetricQuery = explore
        ? getDimensions(explore).filter((field) =>
              resultsData?.metricQuery.dimensions.includes(fieldId(field)),
          )
        : [];

    const metricsAndTableCalculations: Array<Metric | TableCalculation> =
        explore
            ? [
                  ...getMetrics(explore),
                  ...(resultsData?.metricQuery.tableCalculations || []),
              ].filter((item) => {
                  if (isField(item)) {
                      return resultsData?.metricQuery.metrics.includes(
                          fieldId(item),
                      );
                  }
                  return true;
              })
            : [];

    const items = [...dimensionsInMetricQuery, ...metricsAndTableCalculations];

    const xAxisField = items.find(
        (item) => getItemId(item) === dirtyLayout?.xField,
    );

    const fallbackSeriesColours = useMemo(() => {
        return (dirtyEchartsConfig?.series || [])
            .filter(({ color }) => !color)
            .reduce<Record<string, string>>(
                (sum, series, index) => ({
                    ...sum,
                    [getSeriesId(series)]: getDefaultSeriesColor(index),
                }),
                {},
            );
    }, [dirtyEchartsConfig]);

    const getSeriesColor = useCallback(
        (seriesId: string) => {
            return fallbackSeriesColours[seriesId];
        },
        [fallbackSeriesColours],
    );

    const selectedAxisInSeries = Array.from(
        new Set(
            dirtyEchartsConfig?.series?.map(({ yAxisIndex }) => yAxisIndex),
        ),
    );
    const isAxisTheSameForAllSeries: boolean =
        selectedAxisInSeries.length === 1;
    const selectedAxisIndex = selectedAxisInSeries[0] || 0;

    return (
        <Wrapper>
            <Tabs
                onChange={setTab}
                selectedTabId={tab}
                renderActiveTabPanelOnly
            >
                {!isBigNumber && (
                    <Tab
                        id="layout"
                        title="Layout"
                        panel={<FieldLayoutOptions items={items} />}
                    />
                )}
                {!isBigNumber && (
                    <Tab
                        id="series"
                        title="Series"
                        panel={
                            pivotDimension ? (
                                <GroupedSeriesConfiguration
                                    items={items}
                                    layout={dirtyLayout}
                                    series={dirtyEchartsConfig?.series}
                                    getSeriesColor={getSeriesColor}
                                    updateSingleSeries={updateSingleSeries}
                                    updateAllGroupedSeries={
                                        updateAllGroupedSeries
                                    }
                                />
                            ) : (
                                <BasicSeriesConfiguration
                                    items={items}
                                    layout={dirtyLayout}
                                    series={dirtyEchartsConfig?.series}
                                    getSeriesColor={getSeriesColor}
                                    updateSingleSeries={updateSingleSeries}
                                />
                            )
                        }
                    />
                )}
                <Tab
                    id="axes"
                    title="Axes"
                    panel={
                        <>
                            <InputWrapper
                                label={`${
                                    dirtyLayout?.flipAxes ? 'Y' : 'X'
                                }-axis label`}
                            >
                                <InputGroup
                                    placeholder="Enter axis label"
                                    defaultValue={
                                        dirtyEchartsConfig?.xAxis?.[0]?.name ||
                                        (xAxisField && getItemLabel(xAxisField))
                                    }
                                    onBlur={(e) =>
                                        setXAxisName(e.currentTarget.value)
                                    }
                                />
                            </InputWrapper>
                            {!isBigNumber && (
                                <InputWrapper
                                    label={`${
                                        dirtyLayout?.flipAxes ? 'X' : 'Y'
                                    }-axis label (${
                                        dirtyLayout?.flipAxes
                                            ? 'bottom'
                                            : 'left'
                                    })`}
                                >
                                    <InputGroup
                                        placeholder="Enter axis label"
                                        defaultValue={
                                            dirtyEchartsConfig?.yAxis?.[0]
                                                ?.name ||
                                            getAxisName({
                                                isAxisTheSameForAllSeries,
                                                selectedAxisIndex,
                                                axisReference: 'yRef',
                                                axisIndex: 0,
                                                series: dirtyEchartsConfig?.series,
                                                items,
                                            })
                                        }
                                        onBlur={(e) =>
                                            setYAxisName(
                                                0,
                                                e.currentTarget.value,
                                            )
                                        }
                                    />
                                </InputWrapper>
                            )}
                            {!isBigNumber && (
                                <InputWrapper
                                    label={`${
                                        dirtyLayout?.flipAxes ? 'X' : 'Y'
                                    }-axis label (${
                                        dirtyLayout?.flipAxes ? 'top' : 'right'
                                    })`}
                                >
                                    <InputGroup
                                        placeholder="Enter axis label"
                                        defaultValue={
                                            dirtyEchartsConfig?.yAxis?.[1]
                                                ?.name ||
                                            getAxisName({
                                                isAxisTheSameForAllSeries,
                                                selectedAxisIndex,
                                                axisReference: 'yRef',
                                                axisIndex: 1,
                                                series: dirtyEchartsConfig?.series,
                                                items,
                                            })
                                        }
                                        onBlur={(e) =>
                                            setYAxisName(
                                                1,
                                                e.currentTarget.value,
                                            )
                                        }
                                    />
                                </InputWrapper>
                            )}
                        </>
                    }
                />
            </Tabs>
        </Wrapper>
    );
};

export default ChartConfigTabs;
