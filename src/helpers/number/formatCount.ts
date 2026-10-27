import {exteralessSettings} from '@stores/exteralessSettings';
import formatNumber from '@helpers/number/formatNumber';
import numberThousandSplitter from '@helpers/number/numberThousandSplitter';

/**
 * A count for a badge, a views line, a reaction — `formatNumber` unless the
 * user asked for exact numbers (`DisableNumberRounding`), then every digit,
 * grouped like the rest of the client's exact numbers (NBSP, RTL-safe).
 *
 * Reading the setting here is what makes a Solid expression update in place;
 * imperative owners re-read it from `exteraless_settings_updated`.
 */
export default function formatCount(count: number, decimals = 2): string {
  if(!exteralessSettings.DisableNumberRounding) {
    return formatNumber(count, decimals);
  }

  return numberThousandSplitter(count);
}
