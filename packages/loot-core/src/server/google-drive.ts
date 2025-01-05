const ACTUAL_BUDGET_GOOGLE_DRIVE_FOLDER = '.actual_budget';

interface ActualInfo {
  ACTUAL_FOLDER_ID: string | null;
}

const ACTUAL_INFO: ActualInfo = {
  ACTUAL_FOLDER_ID: null,
};

async function createFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string,
) {
  const body = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    body['parents'] = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Failed to create folder');
  }

  const data = await response.json();
  return data;
}

async function listFiles(accessToken: string, parentFolderId?: string) {
  let url =
    'https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,appProperties)';

  if (parentFolderId) {
    const parentFolderQuery = encodeURIComponent(
      `q=‘${parentFolderId}’+in+parents`,
    );
    url = `https://www.googleapis.com/drive/v3/files?${parentFolderQuery}&pageSize=10&fields=files(id,name,appProperties)`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list files');
  }

  const data = await response.json();
  return data.files;
}

async function uploadFile(
  accessToken: string,
  metadata: { name: string; mimeType: string },
  customProperties: { [key: string]: string | boolean },
  buffer: Buffer,
  googleDriveFileId?: string,
  parentFolderId?: string,
) {
  let url = `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`;

  const body = {
    name: metadata.name,
    mimeType: metadata.mimeType,
    appProperties: customProperties,
    parents: parentFolderId ? [parentFolderId] : [],
  };

  if (googleDriveFileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${googleDriveFileId}?uploadType=resumable`;
    body['parents'] = undefined;
  }

  console.log('url', url);
  console.log('body', body);
  const sessionResponse = await fetch(url, {
    method: googleDriveFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('sessionResponse', sessionResponse);

  if (!sessionResponse.ok) {
    throw new Error('Failed to create upload session');
  }

  const uploadUrl = sessionResponse.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('Failed to get upload URL');
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': metadata.mimeType,
      'Content-Length': buffer.length.toString(),
    },
    body: buffer,
  });

  console.log('uploadResponse', uploadResponse);

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await uploadResponse.json();
  console.log('data', data);
  return data;
}

async function downloadFile(
  accessToken: string,
  fileId: string,
): Promise<Buffer> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export interface GoogleDriveFile {
  deleted: boolean;
  fileId: string;
  googleDriveFileId: string;
  lastSyncTimestamp?: string;
  groupId?: string;
  name: string;
  encryptKeyId?: string;
  hasKey: boolean;
  needSync: boolean;
}

export const initializeGoogleDrive = async (
  accessToken: string,
): Promise<void> => {
  const files = await listFiles(accessToken);

  for (const file of files) {
    if (file.name === ACTUAL_BUDGET_GOOGLE_DRIVE_FOLDER) {
      ACTUAL_INFO.ACTUAL_FOLDER_ID = file.id;
      return;
    }
  }

  // setup actual budget folder in google drive
  const response = await createFolder(
    accessToken,
    ACTUAL_BUDGET_GOOGLE_DRIVE_FOLDER,
  );
  ACTUAL_INFO.ACTUAL_FOLDER_ID = response.id;
};

export const getBudgetsList = async (
  gAccessToken: string,
): Promise<GoogleDriveFile[]> => {
  const files = await listFiles(gAccessToken);
  console.log('files', files);
  const budgetFiles = files.filter(
    file => file.appProperties?.isBudgetFile === 'true',
  );
  console.log('budgetFiles', budgetFiles);

  return budgetFiles.map(file => ({
    deleted: false,
    googleDriveFileId: file.id,
    lastSyncTimestamp: file.appProperties?.lastUpdated,
    fileId: file.appProperties?.id,
    name: file.appProperties?.budgetName,
    encryptKeyId: null,
    hasKey: false,
    needSync: true,
  }));
};

export const uploadBudgetFile = async (
  accessToken: string,
  file: Buffer,
  fileName: string,
  properties: { [key: string]: string | boolean },
  googleDriveFileId?: string,
) => {
  if (!ACTUAL_INFO.ACTUAL_FOLDER_ID) {
    throw new Error('Actual budget folder not found');
  }

  const metadata = {
    name: fileName,
    mimeType: 'application/zip',
  };

  const customProperties = {
    isBudgetFile: 'true',
    lastUpdated: new Date().toISOString(),
    ...properties,
  };

  const response = await uploadFile(
    accessToken,
    metadata,
    customProperties,
    file,
    googleDriveFileId,
    ACTUAL_INFO.ACTUAL_FOLDER_ID,
  );

  return response;
};

export const checkIfBudgetFileExists = async (
  accessToken: string,
  fileId: string,
) => {
  console.log('ACTUAL_INFO.ACTUAL_FOLDER_ID', ACTUAL_INFO.ACTUAL_FOLDER_ID);
  const files = await listFiles(accessToken, ACTUAL_INFO.ACTUAL_FOLDER_ID);
  const budgetFiles = files.filter(
    file => file.appProperties?.isBudgetFile === 'true',
  );
  const budgetFile = budgetFiles.find(file => file.id === fileId);
  return !!budgetFile;
};

export const downloadBudgetFile = async (
  accessToken: string,
  fileId: string,
) => {
  const fileBuffer = await downloadFile(accessToken, fileId);
  return fileBuffer;
};
