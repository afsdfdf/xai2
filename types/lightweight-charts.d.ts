declare module 'lightweight-charts' {
  export const enum ColorType {
    Solid = 0,
    VerticalGradient = 1,
  }

  export const enum CrosshairMode {
    Normal = 0,
    Magnet = 1,
  }

  export const enum LineStyle {
    Solid = 0,
    Dotted = 1,
    Dashed = 2,
    LargeDashed = 3,
    SparseDotted = 4,
  }

  export const enum PriceScaleMode {
    Normal = 0,
    Logarithmic = 1,
    Percentage = 2,
    IndexedTo100 = 3,
  }

  export type MouseEventParams = {
    time: number | string;
    point: { x: number; y: number };
    seriesData: Map<any, any>;
    hoveredSeries: any;
    hoveredMarkerId: any;
    dataPoints: any[];
  };

  export type Range = {
    from: number;
    to: number;
  };

  export type LogicalRangeChangeEventHandler = (range: Range | null) => void;

  export type ISeriesApi<T extends SeriesType = SeriesType> = {
    setData: (data: any[]) => void;
    update: (data: any) => void;
    // Other methods as needed
  };

  export type IChartApi = {
    remove: () => void;
    resize: (width: number, height: number) => void;
    timeScale: () => {
      fitContent: () => void;
      setVisibleLogicalRange: (range: Range) => void;
      subscribeVisibleLogicalRangeChange: (handler: LogicalRangeChangeEventHandler) => void;
    };
    subscribeCrosshairMove: (handler: (param: MouseEventParams) => void) => void;
    addCandlestickSeries: (options?: any) => ISeriesApi<'Candlestick'>;
    addLineSeries: (options?: any) => ISeriesApi<'Line'>;
    addHistogramSeries: (options?: any) => ISeriesApi<'Histogram'>;
    // Other methods as needed
  };

  export type SeriesType = 'Line' | 'Area' | 'Bar' | 'Candlestick' | 'Histogram';

  export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };

  export function createChart(
    container: HTMLElement,
    options?: any
  ): IChartApi;
} 