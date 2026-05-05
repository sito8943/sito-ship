export type OffsetAxis = "x" | "y" | "z";
export type OffsetAxisOption = {
  axis: OffsetAxis;
  index: 0 | 1 | 2;
  min: number;
  max: number;
  step: number;
};
