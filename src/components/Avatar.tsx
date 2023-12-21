import React, {useEffect, useState, useMemo} from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import useNetwork from '@hooks/useNetwork';
import useStyleUtils from '@hooks/useStyleUtils';
import useTheme from '@hooks/useTheme';
import useThemeIllustrations from '@hooks/useThemeIllustrations';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ReportUtils from '@libs/ReportUtils';
import {AvatarSource} from '@libs/UserUtils';
import type {AvatarSizeName} from '@styles/utils';
import CONST from '@src/CONST';
import {AvatarType} from '@src/types/onyx/OnyxCommon';
import Icon from './Icon';
import Image from './Image';

type AvatarProps = {
    /** Source for the avatar. Can be a URL or an icon. */
    source?: AvatarSource;

    /** Extra styles to pass to Image */
    imageStyles?: StyleProp<ViewStyle>;

    /** Additional styles to pass to Icon */
    iconAdditionalStyles?: StyleProp<ViewStyle>;

    /** Extra styles to pass to View wrapper */
    containerStyles?: StyleProp<ViewStyle>;

    /** Set the size of Avatar */
    size?: AvatarSizeName;

    /**
     * The fill color for the icon. Can be hex, rgb, rgba, or valid react-native named color such as 'red' or 'blue'
     * If the avatar is type === workspace, this fill color will be ignored and decided based on the name prop.
     */
    fill?: string;

    /** A fallback avatar icon to display when there is an error on loading avatar from remote URL.
     * If the avatar is type === workspace, this fallback icon will be ignored and decided based on the name prop.
     */
    fallbackIcon?: AvatarSource;

    /** Denotes whether it is an avatar or a workspace avatar */
    type?: AvatarType;

    /** Owner of the avatar. If user, displayName. If workspace, policy name */
    name?: string;
};

function Avatar({
    source,
    imageStyles,
    iconAdditionalStyles,
    containerStyles,
    size = CONST.AVATAR_SIZE.DEFAULT,
    fill,
    fallbackIcon = undefined,
    type = CONST.ICON_TYPE_AVATAR,
    name = '',
}: AvatarProps) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const illustrations = useThemeIllustrations();
    const [imageError, setImageError] = useState(false);

    useNetwork({onReconnect: () => setImageError(false)});

    useEffect(() => {
        setImageError(false);
    }, [source]);

    const isWorkspace = type === CONST.ICON_TYPE_WORKSPACE;
    const fallbackAvatar = useMemo(
        () => (isWorkspace ? ReportUtils.getDefaultWorkspaceAvatar(name) : fallbackIcon ?? illustrations.FallbackAvatar),
        [fallbackIcon, illustrations.FallbackAvatar, isWorkspace, name],
    );

    if (!source) {
        return null;
    }

    const iconSize = StyleUtils.getAvatarSize(size);

    const imageStyle = [StyleUtils.getAvatarStyle(size), imageStyles, styles.noBorderRadius];
    const iconStyle = imageStyles ? [StyleUtils.getAvatarStyle(size), styles.bgTransparent, imageStyles] : undefined;

    const iconFillColor = isWorkspace ? StyleUtils.getDefaultWorkspaceAvatarColor(name).fill : fill ?? theme.icon;

    const avatarSource = imageError ? fallbackAvatar : source;

    return (
        <View style={[containerStyles, styles.pointerEventsNone]}>
            {typeof avatarSource === 'function' ? (
                <View style={iconStyle}>
                    <Icon
                        src={avatarSource}
                        height={iconSize}
                        width={iconSize}
                        fill={imageError ? theme.offline : iconFillColor}
                        additionalStyles={[
                            StyleUtils.getAvatarBorderStyle(size, type),
                            isWorkspace && StyleUtils.getDefaultWorkspaceAvatarColor(name),
                            imageError && StyleUtils.getBackgroundColorStyle(theme.fallbackIconColor),
                            iconAdditionalStyles,
                        ]}
                    />
                </View>
            ) : (
                <View style={[iconStyle, StyleUtils.getAvatarBorderStyle(size, type), iconAdditionalStyles]}>
                    <Image
                        source={{uri: avatarSource}}
                        style={imageStyle}
                        onError={() => setImageError(true)}
                    />
                </View>
            )}
        </View>
    );
}

Avatar.displayName = 'Avatar';

export default Avatar;
