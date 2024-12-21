import type React from 'react';

import { send } from 'loot-core/src/platform/client/fetch';

import { Button } from '../common/Button2';
import { View } from '../common/View';

export function GoogleDriveUploadButton() {
  const syncToGoogleDrive = async () => {
    console.log(`Uploading file to Google Drive`);
    const response = await send('google-drive-export-budget');

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
