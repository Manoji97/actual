import * as constants from '../constants';
import type {
  SetGoogleAuthAction,
  GoogleDriveState,
  SetGoogleDriveAction,
  GoogleAuthState,
} from '../state-types/google';

export function setGoogleAuth(state: GoogleAuthState): SetGoogleAuthAction {
  return {
    type: constants.SET_GOOGLE_AUTH,
    state,
  };
}

export function setGoogleDrive(state: GoogleDriveState): SetGoogleDriveAction {
  return {
    type: constants.SET_GOOGLE_DRIVE,
    state,
  };
}
