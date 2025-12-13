import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/es';

dayjs.extend(relativeTime)
dayjs.extend(isoWeek)
dayjs.extend(advancedFormat)
dayjs.locale('es')

export default dayjs  