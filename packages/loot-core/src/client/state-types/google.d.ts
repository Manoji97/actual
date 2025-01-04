import type * as constants from '../constants';

export type GoogleAuthState = {
  accessToken: string?;
  loggedIn: boolean;
};

export type SetGoogleAuthAction = {
  type: typeof constants.SET_GOOGLE_AUTH;
  state: GoogleAuthState;
};
