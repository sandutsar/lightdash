import {
    ApiError,
    CreateDashboard,
    Dashboard,
    DashboardBasicDetails,
    DashboardTileTypes,
    FilterableField,
    UpdateDashboard,
} from 'common';
import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from 'react-query';
import { UseQueryResult } from 'react-query/types/react/types';
import { useHistory, useParams } from 'react-router-dom';
import { useDeepCompareEffect } from 'react-use';
import { lightdashApi } from '../../api';
import { useApp } from '../../providers/AppProvider';
import useQueryError from '../useQueryError';

const getDashboard = async (id: string) =>
    lightdashApi<Dashboard>({
        url: `/dashboards/${id}`,
        method: 'GET',
        body: undefined,
    });

const createDashboard = async (projectUuid: string, data: CreateDashboard) =>
    lightdashApi<Dashboard>({
        url: `/projects/${projectUuid}/dashboards`,
        method: 'POST',
        body: JSON.stringify(data),
    });

const updateDashboard = async (id: string, data: UpdateDashboard) =>
    lightdashApi<undefined>({
        url: `/dashboards/${id}`,
        method: 'PATCH',
        body: JSON.stringify(data),
    });

const deleteDashboard = async (id: string) =>
    lightdashApi<undefined>({
        url: `/dashboards/${id}`,
        method: 'DELETE',
        body: undefined,
    });

export const getChartAvailableFilters = async (savedChartUuid: string) =>
    lightdashApi<FilterableField[]>({
        url: `/saved/${savedChartUuid}/availableFilters`,
        method: 'GET',
        body: undefined,
    });

export const useAvailableDashboardFilterTargets = (
    dashboard: Dashboard | undefined,
    availableTiles: Dashboard['tiles'],
): { isLoading: boolean; data: FilterableField[] } => {
    const availableTilesToFilter =
        dashboard?.tiles.length != 0 ? dashboard?.tiles : availableTiles;
    const queries = useMemo(() => {
        const savedChartUuids = (availableTilesToFilter || [])
            .map((tile) =>
                tile.type === DashboardTileTypes.SAVED_CHART
                    ? tile.properties.savedChartUuid
                    : null,
            )
            .filter((id) => id !== null) as string[];
        return savedChartUuids.map((savedChartUuid) => ({
            queryKey: ['available_filters', savedChartUuid],
            queryFn: () => getChartAvailableFilters(savedChartUuid),
        }));
    }, [dashboard]);
    const results = useQueries(queries) as UseQueryResult<
        FilterableField[],
        ApiError
    >[]; // useQueries doesn't allow us to specify TError

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [availableFilters, setAvailableFilters] = useState<FilterableField[]>(
        [],
    );

    useDeepCompareEffect(() => {
        setIsLoading(results.some((q) => q.isLoading));
        setAvailableFilters(
            results
                .flatMap((q) => q.data || [])
                .filter(
                    (field, index, allFields) =>
                        index ===
                        allFields.findIndex(
                            (f) =>
                                f.table === field.table &&
                                f.name === field.name,
                        ),
                ),
        );
    }, [results]);

    return {
        isLoading,
        data: availableFilters,
    };
};

export const useDashboardQuery = (id?: string) => {
    const setErrorResponse = useQueryError();
    return useQuery<Dashboard, ApiError>({
        queryKey: ['saved_dashboard_query', id],
        queryFn: () => getDashboard(id || ''),
        enabled: id !== undefined,
        retry: false,
        onError: (result) => setErrorResponse(result),
    });
};

export const useUpdateDashboard = (
    id: string,
    showRedirectButton: boolean = false,
) => {
    const history = useHistory();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useApp();
    return useMutation<undefined, ApiError, UpdateDashboard>(
        (data) => updateDashboard(id, data),
        {
            mutationKey: ['dashboard_update'],
            onSuccess: async (_, variables) => {
                await queryClient.invalidateQueries('dashboards');
                await queryClient.invalidateQueries([
                    'saved_dashboard_query',
                    id,
                ]);
                const onlyUpdatedName: boolean =
                    Object.keys(variables).length === 1 &&
                    Object.keys(variables).includes('name');
                showToastSuccess({
                    title: `Success! Dashboard ${
                        onlyUpdatedName ? 'name ' : ''
                    }was updated.`,
                    action: showRedirectButton
                        ? {
                              text: 'Open dashboard',
                              icon: 'arrow-right',
                              onClick: () =>
                                  history.push(
                                      `/projects/${projectUuid}/dashboards/${id}`,
                                  ),
                          }
                        : undefined,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to update dashboard`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useUpdateDashboardName = (
    id: string,
    showRedirectButton: boolean = false,
) => {
    const hook = useUpdateDashboard(id, showRedirectButton);
    return {
        ...hook,
        mutate: ({ name, description }: DashboardBasicDetails) =>
            hook.mutate({ name, description }),
    };
};

export const useCreateMutation = (
    projectUuid: string,
    showRedirectButton: boolean = false,
) => {
    const history = useHistory();
    const { showToastSuccess, showToastError } = useApp();
    const queryClient = useQueryClient();
    return useMutation<Dashboard, ApiError, CreateDashboard>(
        (data) => createDashboard(projectUuid, data),
        {
            mutationKey: ['dashboard_create', projectUuid],
            onSuccess: async (result) => {
                await queryClient.invalidateQueries('dashboards');
                showToastSuccess({
                    title: `Success! Dashboard was created.`,
                    action: showRedirectButton
                        ? {
                              text: 'Open dashboard',
                              icon: 'arrow-right',
                              onClick: () =>
                                  history.push(
                                      `/projects/${projectUuid}/dashboards/${result.uuid}`,
                                  ),
                          }
                        : undefined,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to create dashboard`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useDeleteMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useApp();
    return useMutation<undefined, ApiError, string>(deleteDashboard, {
        onSuccess: async () => {
            await queryClient.invalidateQueries('dashboards');
            showToastSuccess({
                title: `Deleted! Dashboard was deleted.`,
            });
        },
        onError: (error) => {
            showToastError({
                title: `Failed to delete dashboard`,
                subtitle: error.error.message,
            });
        },
    });
};
