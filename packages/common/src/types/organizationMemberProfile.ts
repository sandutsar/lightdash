export enum OrganizationMemberRole {
    VIEWER = 'viewer',
    EDITOR = 'editor',
    ADMIN = 'admin',
}

export type OrganizationMemberProfile = {
    userUuid: string;
    firstName: string;
    lastName: string;
    email: string;
    organizationUuid: string;
    role: OrganizationMemberRole;
};

export type OrganizationMemberProfileUpdate = Partial<
    Pick<OrganizationMemberProfile, 'role'>
>;
