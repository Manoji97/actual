export interface GoogleDriveFile {
  deleted: boolean;
  fileId: string;
  groupId?: string;
  name: string;
  encryptKeyId?: string;
  hasKey: boolean;
}

export function listGoogleDriveFiles(): Promise<GoogleDriveFile[]> {
  return new Promise(resolve => {
    resolve([
      {
        deleted: false,
        fileId: 'dummy-file-id-1',
        groupId: 'dummy-group-id-1',
        name: 'dummy-file-1',
        encryptKeyId: null,
        hasKey: false,
      },
      {
        deleted: false,
        fileId: 'dummy-file-id-2',
        groupId: 'dummy-group-id-2',
        name: 'dummy-file-2',
        encryptKeyId: null,
        hasKey: false,
      },
    ]);
  });
}
