import { sdk } from '../sdk'
import { resetPassword } from './resetPassword'
import { manageSmtp } from './manageSmtp'
import { setBaseUrl } from './setBaseUrl'
import { toggleSignups } from './toggleSignups'

export const actions = sdk.Actions.of()
  .addAction(resetPassword)
  .addAction(manageSmtp)
  .addAction(setBaseUrl)
  .addAction(toggleSignups)
