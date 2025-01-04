import type React from 'react';
import { useSelector } from 'react-redux';

import { send } from 'loot-core/src/platform/client/fetch';

import { Button } from '../common/Button2';
import { View } from '../common/View';

export function GoogleDriveUploadButton() {
  const googleInfo = useSelector(state => state.googleAuth);

  const syncToGoogleDrive = async () => {
    console.log(`Uploading file to Google Drive`);
    const response = await send('google-drive-export-budget', {
      accessToken: googleInfo.accessToken,
    });

    if ('error' in response) {
      console.log('Export error code:', response.error);
    }
  };

  return (
    <View>
      <Button variant="primary" aria-label="Menu" onPress={syncToGoogleDrive}>
        sync
      </Button>
    </View>
  );
}
