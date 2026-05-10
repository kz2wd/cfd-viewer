export interface DataFormat {
  gpu_format: GLenum;
  cpu_format: GLenum;
  type: GLenum;
}
export interface WebGlData {
  path: string;
  pressure_format: DataFormat;
  velocity_format: DataFormat;
}

export interface Colormap {
  source: string;
}
