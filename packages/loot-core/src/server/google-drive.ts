import { gapi } from 'gapi-script';

const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const API_KEY = 'YOUR_GOOGLE_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const GOOGLE_DRIVE_ROOT = 'root';
const ACTUAL_BUDGET_GOOGLE_DRIVE_FOLDER = '/actual_budget';

export const initGoogleAPI = () => {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      ],
      scope: SCOPES,
    });
  });
};

export const signInWithGoogle = () => {
  return gapi.auth2.getAuthInstance().signIn();
};

export const signOutFromGoogle = () => {
  return gapi.auth2.getAuthInstance().signOut();
};

export const initActualBudgetGoogleDrive = async () => {
  // if this is successful, we can start uploading files to the actual budget folder
  return {
    actualRootPathId: await getOrCreateFolderIdByPath(
      ACTUAL_BUDGET_GOOGLE_DRIVE_FOLDER,
    ),
  };
};

const GOOGLE_DRIVE_CONFIG = await initActualBudgetGoogleDrive();

const getOrCreateFolderIdByPath = async (
  path: string, // starts with a slash
): Promise<string | null> => {
  const parts = path.split('/').filter(part => part);
  let parentId = GOOGLE_DRIVE_ROOT;

  for (const part of parts) {
    const response = await gapi.client.drive.files.list({
      q: `‘${parentId}’ in parents and name=‘${part}’ and mimeType=‘application/vnd.google-apps.folder’ and trashed=false`,
      fields: 'files(id, name)',
    });

    let folder = response.result.files?.[0];
    if (!folder) {
      folder = await _createFolder(part, parentId);
    }
    parentId = folder.id;
  }

  // parentId is the id of the last folder in the path (actual_budget folder)
  return parentId;
};

const _createFolder = async (folderName: string, parentId?: string) => {
  parentId = parentId || GOOGLE_DRIVE_ROOT;
  const createResponse = await gapi.client.drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  return createResponse.result;
};

export function listGoogleDriveFilesTest(): Promise<GoogleDriveFile[]> {
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

const listFilesInFolder = async (
  directoryName?: string,
): Promise<gapi.client.drive.File[]> => {
  let folderId = GOOGLE_DRIVE_CONFIG.actualRootPathId;
  if (directoryName !== null) {
    folderId = await getOrCreateFolderIdByPath(
      `${ACTUAL_BUDGET_GOOGLE_DRIVE_FOLDER}/${directoryName}`,
    );
  }

  if (!folderId) {
    throw new Error('Folder not found or could not be created');
  }

  const response = await gapi.client.drive.files.list({
    q: `‘${folderId}’ in parents and trashed=false`,
    fields: 'files(id, name, mimeType, modifiedTime)',
  });

  return response.result.files as gapi.client.drive.File[];
};

const uploadFile = async (
  metadata: GoogleDriveFileMetaData,
  file: File | Blob,
) => {
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  form.append('file', file);

  return gapi.client.request({
    path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    method: 'POST',
    body: form,
  });
};

export interface GoogleDriveFile {
  deleted: boolean;
  fileId: string;
  groupId?: string;
  name: string;
  encryptKeyId?: string;
  hasKey: boolean;
}

interface GoogleDriveFileMetaData {
  name: string;
  mimeType: string;
  parents: string[];
  properties: {
    [key: string]: string;
  };
}

export const getBudgetFiles = async () => {
  const files = await listFilesInFolder();
  return files.map(file => {
    return {
      deleted: false,
      fileId: file.id,
      groupId: null,
      name: file.name,
      encryptKeyId: null,
      hasKey: false,
    };
  });
};

export const uploadBudgetFile = async (buffer: Buffer, fileName: string) => {
  const file = new Blob([buffer], { type: 'application/zip' });
  const customProperties = {
    'actual-budget-file': 'true',
  };
  const metadata: GoogleDriveFileMetaData = {
    name: fileName,
    mimeType: 'application/zip',
    parents: [GOOGLE_DRIVE_CONFIG.actualRootPathId],
    properties: customProperties,
  };

  await uploadFile(metadata, file);
};
