import type * as constants from '../constants';

export type GoogleAuthState = {
  accessToken: string?;
  loggedIn: boolean;
};

export type GoogleDriveState = {
  isUploading: boolean;
};

export type GoogleState = {
  auth: GoogleAuthState;
  drive: GoogleDriveState;
};

export type SetGoogleAuthAction = {
  type: typeof constants.SET_GOOGLE_AUTH;
  state: GoogleAuthState;
};

export type SetGoogleDriveAction = {
  type: typeof constants.SET_GOOGLE_DRIVE;
  state: GoogleDriveState;
};

export type GoogleActions = SetGoogleAuthAction | SetGoogleDriveAction;
