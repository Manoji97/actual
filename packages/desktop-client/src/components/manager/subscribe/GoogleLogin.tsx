import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { gapi } from 'gapi-script';

import { setGoogleAuth } from 'loot-core/client/actions';

import { theme } from '../../../style';
import { Button } from '../../common/Button2';
import { View } from '../../common/View';

export const GoogleLogin = () => {
  const google = useSelector(state => state.google);
  console.log('GL', google);

  const dispatch = useDispatch();
  let refreshIntervalId = null;

  const signIn = async () => {
    const user = await gapi.auth2.getAuthInstance().signIn();
    const token = user.getAuthResponse().access_token;
    dispatch(setGoogleAuth({ accessToken: token, loggedIn: true }));

    // Set up token refresh
    const refreshToken = () => {
      user.reloadAuthResponse().then(authResponse => {
        const newToken = authResponse.access_token;
        dispatch(setGoogleAuth({ accessToken: newToken, loggedIn: true }));
      });
    };

    // Refresh the token before it expires
    refreshIntervalId = setInterval(refreshToken, 3500 * 1000); // Refresh 100 seconds before expiration
  };

  const signOut = async () => {
    await gapi.auth2.getAuthInstance().signOut();
    dispatch(setGoogleAuth({ accessToken: null, loggedIn: false }));

    // Clear the interval
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };

    // Add a listener for tab close or browser close
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup the listener on component unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [refreshIntervalId]);

  return (
    <View
      style={{
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        padding: 20,
        position: 'absolute',
        right: 0,
        top: 0,
      }}
    >
      <Button
        variant="primary"
        onPress={signIn}
        style={{
          marginBottom: 10,
          fontSize: 20,
        }}
      >
        Sign In with Google
      </Button>
      <Button
        variant="bare"
        onPress={signOut}
        style={{
          color: theme.errorText,
          marginTop: 10,
          fontSize: 20,
        }}
      >
        Sign out
      </Button>
    </View>
  );
};
