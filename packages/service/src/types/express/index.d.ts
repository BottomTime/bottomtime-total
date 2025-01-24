import { Alert } from '../../alerts';
import { Certification } from '../../certifications';
import { DiveSite, DiveSiteReview } from '../../diveSites';
import { LogEntry, LogEntryImport } from '../../logEntries';
import { Notification } from '../../notifications';
import { Operator, OperatorReview, OperatorTeamMember } from '../../operators';
import { Tank } from '../../tanks';
import { User as BTUser } from '../../users';

declare global {
  namespace Express {
    interface Request {
      targetAlert: Alert | undefined;
      targetCertification: Certification | undefined;
      targetDiveOperator: Operator | undefined;
      targetDiveOperatorReview: OperatorReview | undefined;
      targetDiveSite: DiveSite | undefined;
      targetDiveSiteReview: DiveSiteReview | undefined;
      targetFriend: BTUser | undefined;
      targetLogEntry: LogEntry | undefined;
      targetLogEntryImport: LogEntryImport | undefined;
      targetNotification: Notification | undefined;
      targetTank: Tank | undefined;
      targetTeamMember: OperatorTeamMember | undefined;
      targetUser: BTUser | undefined;
    }
  }
}

export {};
