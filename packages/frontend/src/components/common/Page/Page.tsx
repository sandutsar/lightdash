import { Colors } from '@blueprintjs/core';
import React, { FC } from 'react';
import styled from 'styled-components';
import AboutFooter from '../../AboutFooter';
import Content from './Content';

type Props = {
    isFullHeight?: boolean;
    isContentFullWidth?: boolean;
};

const PageBase = styled('div')<Props>`
    min-height: calc(
        100vh - ${(props) => (props.isFullHeight ? '0px' : '50px')}
    );
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: ${(props) =>
        props.isContentFullWidth ? 'stretch' : 'center'};
    background: ${Colors.LIGHT_GRAY4};
`;

const Page: FC<Props> = ({ children, ...props }) => (
    <PageBase {...props}>
        <Content>{children}</Content>
        <AboutFooter />
    </PageBase>
);

export default Page;
