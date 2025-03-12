import { Alert } from '../../alerts';
import {
  Agency,
  Certification,
  ProfessionalAssociation,
} from '../../certifications';
import { DiveSite, DiveSiteReview } from '../../diveSites';
import { LogEntry, LogEntryImport } from '../../logEntries';
import { Notification } from '../../notifications';
import { Operator, OperatorReview } from '../../operators';
import { Tank } from '../../tanks';
import { User as BTUser } from '../../users';

declare global {
  namespace Express {
    interface Request {
      targetAgency: Agency | undefined;
      targetAlert: Alert | undefined;
      targetBuddy: BTUser | undefined;
      targetCertification: Certification | undefined;
      targetDiveOperator: Operator | undefined;
      targetDiveOperatorReview: OperatorReview | undefined;
      targetDiveSite: DiveSite | undefined;
      targetDiveSiteReview: DiveSiteReview | undefined;
      targetFriend: BTUser | undefined;
      targetLogEntry: LogEntry | undefined;
      targetLogEntryImport: LogEntryImport | undefined;
      targetNotification: Notification | undefined;
      targetProfessionalAssociation: ProfessionalAssociation | undefined;
      targetTank: Tank | undefined;
      targetUser: BTUser | undefined;
    }
  }
}

export {};
