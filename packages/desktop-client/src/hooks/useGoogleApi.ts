import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { gapi } from 'gapi-script';

import { setGoogleAuth } from 'loot-core/src/client/actions';

const CLIENT_ID =
  '558138009050-pajhd6qq30tv8u7gj5qg0lh5078thq3d.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAgykhNieVqzYg5rHQtsQPKGbzraLq1Ycc';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const useGoogleApi = () => {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    function start() {
      dispatch(setGoogleAuth({ accessToken: null, loggedIn: false }));
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
          ],
          scope: SCOPES,
        })
        .then(() => {
          setGapiLoaded(true);

          const authInstance = gapi.auth2.getAuthInstance();
          if (authInstance.isSignedIn.get()) {
            const user = authInstance.currentUser.get();
            const token = user.getAuthResponse().access_token;
            dispatch(setGoogleAuth({ accessToken: token, loggedIn: true }));

            // Set up token refresh
            const refreshToken = () => {
              user.reloadAuthResponse().then(authResponse => {
                const newToken = authResponse.access_token;
                dispatch(
                  setGoogleAuth({ accessToken: newToken, loggedIn: true }),
                );
              });
            };

            // Refresh the token before it expires
            setInterval(refreshToken, 3500 * 1000); // Refresh 100 seconds before expiration
          }
        })
        .catch(error => {
          console.error('Error loading gapi', error);
          dispatch(setGoogleAuth({ accessToken: null, loggedIn: false }));
        });
    }

    gapi.load('client:auth2', start);
  }, [dispatch]);

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
    setInterval(refreshToken, 3500 * 1000); // Refresh 100 seconds before expiration
  };

  const signOut = async () => {
    await gapi.auth2.getAuthInstance().signOut();
    dispatch(setGoogleAuth({ accessToken: null, loggedIn: false }));
  };

  return { gapiLoaded, signIn, signOut };
};
