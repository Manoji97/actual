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
    url += `&q=‘${parentFolderId}’+in+parents`;
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
  parentFolderId?: string,
) {
  const sessionResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metadata.name,
        mimeType: metadata.mimeType,
        parents: parentFolderId ? [parentFolderId] : [],
        appProperties: customProperties,
      }),
    },
  );

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

// export function listGoogleDriveFilesTest(): Promise<GoogleDriveFile[]> {
//   return new Promise(resolve => {
//     resolve([
//       {
//         deleted: false,
//         fileId: 'dummy-file-id-1',
//         groupId: 'dummy-group-id-1',
//         name: 'dummy-file-1',
//         encryptKeyId: null,
//         hasKey: false,
//       },
//       {
//         deleted: false,
//         fileId: 'dummy-file-id-2',
//         groupId: 'dummy-group-id-2',
//         name: 'dummy-file-2',
//         encryptKeyId: null,
//         hasKey: false,
//       },
//     ]);
//   });
// }

export interface GoogleDriveFile {
  deleted: boolean;
  fileId: string;
  googleDriveFileId: string;
  groupId?: string;
  name: string;
  encryptKeyId?: string;
  hasKey: boolean;
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
    fileId: file.appProperties?.id,
    name: file.appProperties?.budgetName,
    encryptKeyId: null,
    hasKey: false,
  }));
  // return [
  //   {
  //     deleted: false,
  //     fileId: 'dummy-file-id-1',
  //     groupId: 'dummy-group-id-1',
  //     name: 'dummy-file-1',
  //     encryptKeyId: null,
  //     hasKey: false,
  //   },
  // ];
};

export const uploadBudgetFile = async (
  accessToken: string,
  file: Buffer,
  fileName: string,
  properties: { [key: string]: string | boolean },
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
    ACTUAL_INFO.ACTUAL_FOLDER_ID,
  );

  return response;
};

export const downloadBudgetFile = async (
  accessToken: string,
  fileId: string,
) => {
  const fileBuffer = await downloadFile(accessToken, fileId);
  return fileBuffer;
};
