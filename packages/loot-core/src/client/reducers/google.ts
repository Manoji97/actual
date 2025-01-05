import * as constants from '../constants';
import type { Action } from '../state-types';
import { type GoogleState } from '../state-types/google';

const initialState: GoogleState = {
  auth: {
    accessToken: null,
    loggedIn: false,
  },
  drive: {
    isUploading: false,
  }
};

export function update(state = initialState, action: Action): GoogleState {
  switch (action.type) {
    case constants.SET_GOOGLE_AUTH:
      return {
        ...state,
        auth: {
          ...state.auth,
          ...action.state,
        }
      };
    
    case constants.SET_GOOGLE_DRIVE:
      return {
        ...state,
        drive: {
          ...state.drive,
          ...action.state,
      }
    };

    default:
  }
  return state;
}
