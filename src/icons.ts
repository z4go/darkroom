// Phosphor (regular) icons, inlined at build time.
import aperture from '@phosphor-icons/core/assets/regular/aperture.svg?raw';
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import caretDown from '@phosphor-icons/core/assets/regular/caret-down.svg?raw';
import checkCircle from '@phosphor-icons/core/assets/regular/check-circle.svg?raw';
import copy from '@phosphor-icons/core/assets/regular/copy.svg?raw';
import deviceMobile from '@phosphor-icons/core/assets/regular/device-mobile.svg?raw';
import downloadSimple from '@phosphor-icons/core/assets/regular/download-simple.svg?raw';
import githubLogo from '@phosphor-icons/core/assets/regular/github-logo.svg?raw';
import globe from '@phosphor-icons/core/assets/regular/globe.svg?raw';
import lockSimple from '@phosphor-icons/core/assets/regular/lock-simple.svg?raw';
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import plugs from '@phosphor-icons/core/assets/regular/plugs.svg?raw';
import plugsConnected from '@phosphor-icons/core/assets/regular/plugs-connected.svg?raw';
import sliders from '@phosphor-icons/core/assets/regular/sliders-horizontal.svg?raw';
import terminal from '@phosphor-icons/core/assets/regular/terminal-window.svg?raw';
import usb from '@phosphor-icons/core/assets/regular/usb.svg?raw';
import warning from '@phosphor-icons/core/assets/regular/warning.svg?raw';

export const icons = {
  aperture,
  'arrow-right': arrowRight,
  'caret-down': caretDown,
  'check-circle': checkCircle,
  copy,
  'device-mobile': deviceMobile,
  download: downloadSimple,
  github: githubLogo,
  globe,
  lock: lockSimple,
  plus,
  plugs,
  'plugs-connected': plugsConnected,
  sliders,
  terminal,
  usb,
  warning,
} as const;

export type IconName = keyof typeof icons;
