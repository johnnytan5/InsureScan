declare module 'pdf-poppler' {
  export interface ConvertOptions {
    format?: 'png' | 'jpeg' | 'tiff';
    out_dir?: string;
    out_prefix?: string;
    page?: number;
    scale?: number;
    resolution?: number;
    width?: number;
    height?: number;
    png_quality?: number;
    jpeg_quality?: number;
  }

  export function convert(
    pdf_path: string, 
    options?: ConvertOptions
  ): Promise<void>;
}