import dayjs from 'dayjs';
import localize from 'dayjs/plugin/localizedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(localize);
dayjs.extend(utc);
dayjs.extend(timezone);

export default dayjs;
