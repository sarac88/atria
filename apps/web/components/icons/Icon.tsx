import type { CSSProperties, SVGAttributes } from "react";
import { ICONS } from "./icon-data";

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, "name" | "color"> {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
}

/**
 * Atria Icon — Heroicons-style outline glyph. Inherits colour via currentColor
 * so it matches surrounding text / button colour automatically.
 */
export function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  color = "currentColor",
  style = {},
  ...rest
}: IconProps) {
  const body = ICONS[name];
  if (!body) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: body }}
      {...rest}
    />
  );
}
