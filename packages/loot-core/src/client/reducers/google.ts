import * as constants from '../constants';
import type { Action } from '../state-types';
import { type GoogleAuthState } from '../state-types/google';

const initialState: GoogleAuthState = {
  accessToken: null,
  loggedIn: false,
};

export function update(state = initialState, action: Action): GoogleAuthState {
  switch (action.type) {
    case constants.SET_GOOGLE_AUTH:
      return {
        ...state,
        ...action.state,
      };
    default:
  }
  return state;
}
