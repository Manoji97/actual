import * as constants from '../constants';
import type {
  SetGoogleAuthAction,
  GoogleAuthState,
} from '../state-types/google';

export function setGoogleAuth(state: GoogleAuthState): SetGoogleAuthAction {
  return {
    type: constants.SET_GOOGLE_AUTH,
    state,
  };
}
