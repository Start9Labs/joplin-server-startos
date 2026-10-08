import { primaryUrl } from '../primaryUrl'
import { sdk } from '../sdk'
import { resetPassword } from './resetPassword'
import { manageSmtp } from './manageSmtp'
import { toggleSignups } from './toggleSignups'

export const actions = sdk.Actions.of()
  .addAction(resetPassword)
  .addAction(manageSmtp)
  .addAction(primaryUrl.action)
  .addAction(toggleSignups)
