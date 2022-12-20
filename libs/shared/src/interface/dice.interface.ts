import { PEPA_TRIGGER_FLAG } from '@app/shared/const';

export interface DiceInterface {
  flag: PEPA_TRIGGER_FLAG;
  context?: string;
}
