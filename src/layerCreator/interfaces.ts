import { HistoryStatus } from './historyStatus';

export interface ILayerHistory {
  directory: string;
  id: string;
  version: string;
  status: HistoryStatus;
}
