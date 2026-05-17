import { ContourParams } from "./ContourParams";

export class ShaderProps {
  constructor(
    public yplus: number = 0.0,
    public velocityContour: ContourParams = new ContourParams(),
    public pressureContour: ContourParams = new ContourParams(),
    public qContour: ContourParams = new ContourParams(),
  ) {}
}
