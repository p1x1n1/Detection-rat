export interface AnalyzeResult {
    expId: number;
    videoPath: string;
    metrics: any;
}

export interface AnalyzeProccessed{
    expId: number;
    videoPath: string;
}

export interface AnalyzedError{
    expId: number;
    videoPath: string;
    error: string;    
}

export class AnalyzeStopped {
  expId: number;
  videoPath?: string;
}