import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors } from '@/theme/tokens';

export type IconName =
  | 'home' | 'chart' | 'plus' | 'food' | 'user' | 'flame' | 'dumbbell' | 'drop' | 'wheat' | 'protein' | 'fat'
  | 'chevron' | 'chevronBack' | 'bell' | 'clock' | 'search' | 'barcode' | 'camera' | 'crown' | 'calendar' | 'play'
  | 'pause' | 'check' | 'close' | 'trash' | 'star' | 'starFill' | 'settings' | 'help' | 'trophy' | 'list' | 'cart'
  | 'edit' | 'copy' | 'dots' | 'bowl' | 'bolt' | 'layers' | 'repeat' | 'weight' | 'timer' | 'sparkle' | 'image'
  | 'alarm' | 'moon' | 'minus' | 'skip' | 'swap' | 'lock' | 'logout' | 'download' | 'flag' | 'calc' | 'volume' | 'mute' | 'body';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 22, color = colors.accent, strokeWidth = 1.7 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const content = (() => {
    switch (name) {
      case 'home':
        return <Path {...p} d="M4 11.5 12 4.5l8 7V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19v-7.5ZM9.5 16h5" />;
      case 'chart':
        return (<><Rect {...p} x="4" y="12" width="3.2" height="8" rx="1.6" /><Rect {...p} x="10.4" y="7" width="3.2" height="13" rx="1.6" /><Rect {...p} x="16.8" y="3.5" width="3.2" height="16.5" rx="1.6" /></>);
      case 'plus':
        return <Path {...p} d="M12 5v14M5 12h14" />;
      case 'minus':
        return <Path {...p} d="M5 12h14" />;
      case 'food':
        return <Path {...p} d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M7 3v4M9 3v4M11 3v4M17 21V3c-2.2 1.2-3 3.6-3 6.5V13h3" />;
      case 'user':
        return (<><Circle {...p} cx="12" cy="8" r="4" /><Path {...p} d="M4.5 20.5c1.2-3.7 4-5.5 7.5-5.5s6.3 1.8 7.5 5.5" /></>);
      case 'flame':
        return <Path {...p} d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.6-8 .4 1.8 1.4 2.9 2.3 3.4C11.6 6.6 13 4.4 15 3c-.3 3 2 4.7 3 7 .6 1.4.5 2.9.5 4.8C18.5 18.4 15.9 21 12 21Zm0 0c-1.7 0-2.8-1.2-2.8-2.8 0-1.7 1.4-2.5 1.8-4 .9.8 1.6 1.4 2 2.1.4-.6.6-1.2.6-1.9 1 .9 1.2 2 1.2 3 0 2-1.1 3.6-2.8 3.6Z" />;
      case 'dumbbell':
        return <Path {...p} d="M6.5 7v10M4 9v6M17.5 7v10M20 9v6M6.5 12h11" />;
      case 'drop':
        return <Path {...p} d="M12 3.5s6 6.4 6 10.8A6 6 0 0 1 6 14.3C6 9.9 12 3.5 12 3.5Z" />;
      case 'wheat':
        return <Path {...p} d="M12 21V8M12 12c-2.5 0-4-1.6-4-4 2.5 0 4 1.6 4 4Zm0 0c2.5 0 4-1.6 4-4-2.5 0-4 1.6-4 4Zm0 4.5c-2.5 0-4-1.6-4-4 2.5 0 4 1.6 4 4Zm0 0c2.5 0 4-1.6 4-4-2.5 0-4 1.6-4 4ZM12 8c-1.2-1-1.2-3 0-4.5 1.2 1.5 1.2 3.5 0 4.5Z" />;
      case 'protein':
        return <Path {...p} d="M5 18c1-4.5 2.2-7.6 4.5-10 .9-1 2.4-.7 2.7.6l.4 1.6c1.5-.8 3.6-.5 4.8.9 1.5 1.6 1.4 4.3-.2 5.8-2.6 2.4-7.3 2.6-12.2 1.1Zm4.5-10 3.5 2" />;
      case 'fat':
        return <Path {...p} d="M9.5 6s3.5 4 3.5 6.7a3.5 3.5 0 0 1-7 0C6 10 9.5 6 9.5 6Zm6-2.5s3 3.4 3 5.7a3 3 0 0 1-4.2 2.7" />;
      case 'chevron':
        return <Path {...p} d="M14.5 6 8.5 12l6 6" />;
      case 'chevronBack':
        return <Path {...p} d="M9.5 6l6 6-6 6" />;
      case 'bell':
        return <Path {...p} d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15l1.5-2ZM10 20.5a2 2 0 0 0 4 0" />;
      case 'clock':
        return (<><Circle {...p} cx="12" cy="12" r="8.5" /><Path {...p} d="M12 7.5V12l3 2" /></>);
      case 'alarm':
        return (<><Circle {...p} cx="12" cy="13" r="7.5" /><Path {...p} d="M12 9.5V13l2.5 1.5M4 5.5 7 3M20 5.5 17 3" /></>);
      case 'timer':
        return (<><Circle {...p} cx="12" cy="13.5" r="7" /><Path {...p} d="M12 10v3.5M10 3h4M18 7l1.5-1.5" /></>);
      case 'search':
        return (<><Circle {...p} cx="11" cy="11" r="6.5" /><Path {...p} d="m16 16 4 4" /></>);
      case 'barcode':
        return <Path {...p} d="M4 7V5h3M17 5h3v2M20 17v2h-3M7 19H4v-2M7 9v6M10 9v6M12.5 9v6M15 9v6M17.5 9v6" />;
      case 'camera':
        return (<><Path {...p} d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" /><Circle {...p} cx="12" cy="12.5" r="3.5" /></>);
      case 'image':
        return (<><Rect {...p} x="4" y="5" width="16" height="14" rx="2" /><Circle {...p} cx="9" cy="10" r="1.5" /><Path {...p} d="m4.5 17 4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5" /></>);
      case 'crown':
        return <Path {...p} d="M4 8l4 4 4-6 4 6 4-4-1.5 10h-13L4 8Z" />;
      case 'calendar':
        return (<><Rect {...p} x="4" y="5.5" width="16" height="14.5" rx="2" /><Path {...p} d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>);
      case 'play':
        return <Path stroke={color} strokeWidth={strokeWidth} fill={color} strokeLinejoin="round" d="M8 5.5v13l10.5-6.5L8 5.5Z" />;
      case 'pause':
        return <Path {...p} d="M9 6v12M15 6v12" strokeWidth={strokeWidth + 1} />;
      case 'skip':
        return <Path {...p} d="M6 6l8 6-8 6V6ZM18 6v12" />;
      case 'check':
        return <Path {...p} d="m5 12.5 4.5 4.5L19 7.5" />;
      case 'close':
        return <Path {...p} d="M6 6l12 12M18 6 6 18" />;
      case 'trash':
        return <Path {...p} d="M4.5 7h15M10 4h4M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />;
      case 'star':
        return <Path {...p} d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6L12 4Z" />;
      case 'starFill':
        return <Path stroke={color} strokeWidth={strokeWidth} fill={color} strokeLinejoin="round" d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6L12 4Z" />;
      case 'settings':
        return (<><Circle {...p} cx="12" cy="12" r="3" /><Path {...p} d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" /></>);
      case 'help':
        return (<><Circle {...p} cx="12" cy="12" r="8.5" /><Path {...p} d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01" /></>);
      case 'trophy':
        return <Path {...p} d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />;
      case 'flag':
        return <Path {...p} d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11" />;
      case 'list':
        return <Path {...p} d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />;
      case 'cart':
        return (<><Path {...p} d="M3.5 4.5h2l2 10.5h10l2-7.5H7" /><Circle {...p} cx="9" cy="19" r="1.3" /><Circle {...p} cx="16.5" cy="19" r="1.3" /></>);
      case 'edit':
        return <Path {...p} d="M5 19l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L9 18l-4 1ZM13.5 7.5l3 3" />;
      case 'copy':
        return (<><Rect {...p} x="8.5" y="8.5" width="11" height="11" rx="2" /><Path {...p} d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></>);
      case 'dots':
        return (<><Circle cx="6" cy="12" r="1.6" fill={color} /><Circle cx="12" cy="12" r="1.6" fill={color} /><Circle cx="18" cy="12" r="1.6" fill={color} /></>);
      case 'bowl':
        return <Path {...p} d="M4 11.5h16a8 8 0 0 1-16 0ZM9 19.5h6M9 4c-.8 1 .8 2 0 3.2M12 3.5c-.8 1 .8 2 0 3.2M15 4c-.8 1 .8 2 0 3.2" />;
      case 'bolt':
        return <Path {...p} d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z" />;
      case 'layers':
        return <Path {...p} d="m12 4 8.5 4.5L12 13 3.5 8.5 12 4ZM3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5" />;
      case 'repeat':
        return <Path {...p} d="M17 3.5 20 6.5l-3 3M4 11V9.5a3 3 0 0 1 3-3h13M7 20.5 4 17.5l3-3M20 13v1.5a3 3 0 0 1-3 3H4" />;
      case 'weight':
        return <Path {...p} d="M9.5 7a2.5 2.5 0 1 1 5 0M6.8 7h10.4l2.3 13H4.5L6.8 7Z" />;
      case 'sparkle':
        return <Path {...p} d="M12 3.5c.7 4.4 2.1 5.8 6.5 6.5-4.4.7-5.8 2.1-6.5 6.5-.7-4.4-2.1-5.8-6.5-6.5 4.4-.7 5.8-2.1 6.5-6.5ZM18.5 15.5c.3 1.8.9 2.4 2.5 2.7-1.6.3-2.2.9-2.5 2.7-.3-1.8-.9-2.4-2.5-2.7 1.6-.3 2.2-.9 2.5-2.7Z" />;
      case 'moon':
        return <Path {...p} d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />;
      case 'swap':
        return <Path {...p} d="M7 4 4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7" />;
      case 'lock':
        return (<><Rect {...p} x="5" y="10.5" width="14" height="10" rx="2" /><Path {...p} d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>);
      case 'logout':
        return <Path {...p} d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14M10 12h10M17 8.5l3.5 3.5-3.5 3.5" />;
      case 'download':
        return <Path {...p} d="M12 4v11M7.5 11 12 15.5l4.5-4.5M5 19.5h14" />;
      case 'calc':
        return (<><Rect {...p} x="5.5" y="3.5" width="13" height="17" rx="2" /><Path {...p} d="M8.5 7.5h7M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01" /></>);
      case 'volume':
        return <Path {...p} d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3v-5ZM15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" />;
      case 'mute':
        return <Path {...p} d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3v-5ZM15.5 9.5l5 5M20.5 9.5l-5 5" />;
      case 'body':
        return (<><Circle {...p} cx="12" cy="4.8" r="2" /><Path {...p} d="M6 8.5h12M12 8.5v6M12 14.5l-3 6.5M12 14.5l3 6.5M8 8.5l-1.5 6M16 8.5l1.5 6" /></>);
      default:
        return <Line {...p} x1="4" y1="12" x2="20" y2="12" />;
    }
  })();
  return (
    <View style={{ width: size, height: size }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {content}
      </Svg>
    </View>
  );
}
