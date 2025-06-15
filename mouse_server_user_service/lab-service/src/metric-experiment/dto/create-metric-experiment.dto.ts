export class CreateMetricExperimentDto {
    experimentId: number;
    metricId: number;
    startTime: number;
    endTime: number;
    value: number;
    comment?: string;
  }
  