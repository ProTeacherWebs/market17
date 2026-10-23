export {};

type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
};

type GoogleCodeResponse = {
  code: string;
};

type GoogleCodeClient = {
  requestCode: () => void;
};

type GoogleAccounts = {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    prompt: () => void;
  };
  oauth2: {
    initCodeClient: (config: {
      client_id: string;
      scope: string;
      ux_mode: "popup" | "redirect";
      callback: (response: GoogleCodeResponse) => void;
      error_callback?: (error: { type?: string; message?: string }) => void;
    }) => GoogleCodeClient;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}
