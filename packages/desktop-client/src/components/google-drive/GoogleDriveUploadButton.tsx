import type React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { uploadBudgetToGoogleDrive } from 'loot-core/src/client/actions/budgets';

import { Button } from '../common/Button2';
import { View } from '../common/View';

export function GoogleDriveUploadButton() {
  const dispatch = useDispatch();
  const perfs = useSelector(state => state.prefs);
  const isUploading = useSelector(state => state.google.drive.isUploading);

  const newSync = !perfs.local?.googleDriveFileId;

  return (
    <View>
      <Button
        variant="primary"
        aria-label="Menu"
        isDisabled={isUploading}
        onPress={async () => {
          await dispatch(uploadBudgetToGoogleDrive());
        }}
      >
        {newSync ? 'new sync' : 'sync'}
      </Button>
    </View>
  );
}
