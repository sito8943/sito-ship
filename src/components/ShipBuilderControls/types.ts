export type OffsetAxis = "x" | "y" | "z";
export type OffsetAxisOption = {
  axis: OffsetAxis;
  index: 0 | 1 | 2;
};

export type TransformModeOption = {
  value: "translate" | "rotate" | "scale";
  label: string;
};
