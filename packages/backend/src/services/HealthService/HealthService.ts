import {
    HealthState,
    LightdashInstallType,
    LightdashMode,
    UnexpectedDatabaseError,
} from 'common';
import { getDockerHubVersion } from '../../clients/DockerHub/DockerHub';
import { LightdashConfig } from '../../config/parseConfig';
import { getMigrationStatus } from '../../database/database';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { UserModel } from '../../models/UserModel';
import { VERSION } from '../../version';

type HealthServiceDependencies = {
    userModel: UserModel;
    projectModel: ProjectModel;
    lightdashConfig: LightdashConfig;
};

export class HealthService {
    private readonly userModel: UserModel;

    private readonly projectModel: ProjectModel;

    private readonly lightdashConfig: LightdashConfig;

    constructor({
        userModel,
        projectModel,
        lightdashConfig,
    }: HealthServiceDependencies) {
        this.userModel = userModel;
        this.projectModel = projectModel;
        this.lightdashConfig = lightdashConfig;
    }

    async getHealthState(isAuthenticated: boolean): Promise<HealthState> {
        const { isComplete, currentVersion } = await getMigrationStatus();

        if (!isComplete) {
            throw new UnexpectedDatabaseError(
                'Database has not been migrated yet',
                { currentVersion },
            );
        }

        const needsProject = !(await this.projectModel.hasProjects());

        const localDbtEnabled =
            process.env.LIGHTDASH_INSTALL_TYPE !==
                LightdashInstallType.HEROKU &&
            this.lightdashConfig.mode !== LightdashMode.CLOUD_BETA;
        return {
            healthy: true,
            mode: this.lightdashConfig.mode,
            version: VERSION,
            needsSetup: !(await this.userModel.hasUsers()),
            needsProject,
            localDbtEnabled,
            defaultProject: undefined,
            isAuthenticated,
            latest: { version: getDockerHubVersion() },
            rudder: this.lightdashConfig.rudder,
            sentry: this.lightdashConfig.sentry,
            intercom: this.lightdashConfig.intercom,
            cohere: this.lightdashConfig.cohere,
            siteUrl: this.lightdashConfig.siteUrl,
            auth: {
                disablePasswordAuthentication:
                    this.lightdashConfig.auth.disablePasswordAuthentication,
                google: {
                    loginPath: this.lightdashConfig.auth.google.loginPath,
                    oauth2ClientId:
                        this.lightdashConfig.auth.google.oauth2ClientId,
                },
            },
            hasEmailClient: !!this.lightdashConfig.smtp,
        };
    }
}
